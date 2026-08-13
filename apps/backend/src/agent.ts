import { prisma } from "@repo/db";
import { emitToProject } from "./ws";
import { ensureSandbox } from "./sandbox";
import { askLLM, assistantMessage, toolResultMessage, type ToolCall } from "./gemini";
import { TOOL_DEFINITIONS, executeTool } from "./tools";
import { execInContainer } from "./e2b";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { clarificationTool, CLARIFY_MARKER } from "./tools/clarification.tool";


export type ClarificationQuestion = {
  id : string;
  question : string;
  type : "options" | "text"
  options?: string[]
}

export type AgentResponse =
| {type : "clarification" , reasoning : string; question : ClarificationQuestion[]}
| {type : "answer" , reasoning : string ;toolCalls : ToolCall[] };


const MAX_ITERATIONS = 10;

function encodeClarification(reasoning: string, questions: ClarificationQuestion[]): string {
  return CLARIFY_MARKER + JSON.stringify({ reasoning, questions });
}

function decodeClarification(content: string): { reasoning: string; questions: ClarificationQuestion[] } | null {
  if (!content.startsWith(CLARIFY_MARKER)) return null;
  try {
    return JSON.parse(content.slice(CLARIFY_MARKER.length));
  } catch {
    return null;
  }
}

function toLLMMessage(msg: { role: string; content: string }) {
  const clarification = msg.role === "assistant" ? decodeClarification(msg.content) : null;

  if (clarification) {
    return {
      role: "assistant",
      content: [
        `I asked a clarifying question: ${clarification.reasoning}`,
        ...clarification.questions.map((q) => `- ${q.question}`),
      ].join("\n"),
    };
  }

  return { role: msg.role, content: msg.content };
}

async function execWithRetry( 
  containerId: string,
  cmd: string,
  retries = 2,
  delayMs = 3000
) {
  let result = await execInContainer(containerId, cmd);
  let attempt = 0;

  while (result.exitCode !== 0 && attempt < retries) {
    attempt++;
    console.log(
      `[retry] "${cmd}" failed (exit ${result.exitCode}), retrying (${attempt}/${retries})...`
    );
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    result = await execInContainer(containerId, cmd);
  }

  return result;
}

export async function runAgent(projectId: string, userMessage: string) {
  try {
    await prisma.message.create({
      data: { projectId, role: "user", content: userMessage }
    });

    emitToProject(projectId, "agent:thinking", {});

    const existingFile = await prisma.projectFile.findMany({
      where: { projectId }
    })

    // Full conversation so far (includes the user message just created above),
    // so the model can see prior turns — including any clarifying question it
    // already asked and how the user answered it.
    const history = await prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    const lastAssistantMessage = [...history].reverse().find((m) => m.role === "assistant");
    const alreadyAskedClarification = lastAssistantMessage
      ? decodeClarification(lastAssistantMessage.content) !== null
      : false;

    const sandbox = await ensureSandbox(projectId)
    const containerId = sandbox.containerId ?? null;

    const messages: any[] = [
      {
        role: "system",
        content: [
          SYSTEM_PROMPT,
          "",
          existingFile.length
            ? `Existing files:\n${existingFile
              .map((f) => `  - ${f.path}`)
              .join("\n")}`
            : "No files yet — this is a completely new project.",
          alreadyAskedClarification
            ? "\nYou already asked a clarifying question in your last turn and the user has now replied. Do NOT call ask_clarification again — proceed with their answers plus reasonable assumptions."
            : "",
        ].join("\n"),
      },
      ...history.map(toLLMMessage),
    ];


    let iteration = 0;
    let finalSummary = "";
    let isDone = false;
    let isClarifying = false;


    while (iteration < MAX_ITERATIONS && !isDone) {
      iteration++;
      console.log(`iteration ${iteration}`)


      const tools = iteration === 1 && !alreadyAskedClarification
        ? [...TOOL_DEFINITIONS, clarificationTool]
        : TOOL_DEFINITIONS;

      const { toolCalls, text } = await askLLM(messages, tools);

      if (text) {
        emitToProject(projectId, "agent:thinking", { text })
      }

      if (toolCalls.length === 0) {
        finalSummary = text;
        break
      }

      messages.push(assistantMessage(text, toolCalls))

      for (const call of toolCalls) {
        console.log(`[AGENT] calling tool: ${call.name}`);
        emitToProject(projectId, "agent:tool_call", { tool: call.name, args: call.args })

        if (call.name === "ask_clarification") {
          const args = call.args as { reasoning: string; questions: ClarificationQuestion[] };
          finalSummary = encodeClarification(args.reasoning, args.questions ?? []);
          isDone = true;
          isClarifying = true;

          emitToProject(projectId, "agent:clarification", {
            reasoning: args.reasoning,
            questions: args.questions ?? [],
          });

          messages.push(toolResultMessage(call.id, "Question sent to the user."));
          break;
        }

        if (call.name === "done") {
          finalSummary = (call.args as { summary: string }).summary ?? "";
          isDone = true;

          messages.push(toolResultMessage(call.id, "acknowlage"))

          break
        }

        const result = await executeTool(call.name, call.args, projectId, containerId);
        console.log(`[agent] ${call.name} result:`, result.slice(0, 120));

        emitToProject(projectId, "agent:too_result", { tool: call.name, result: result.slice(0, 500) });

        messages.push(toolResultMessage(call.id, result))
      }
    }

    if (!isDone && !isClarifying && containerId) {
      console.log("Installing dependencies ...")

      const install = await execWithRetry(containerId, "bun install")

      console.log("Install Exit Code:", install.exitCode)
      console.log("Install stdout:\n", install.stdout)
      console.log("install stderr:\n", install.stderr)

      console.log("Building project ...")

      const build = await execInContainer(containerId, "npm run build")

      console.log("Build Exit Code:", build.exitCode);
      console.log("Build stdout:\n", build.stdout);
      console.log("Build stderr:\n", build.stderr);
    }

    if (!isDone && !finalSummary) {
      finalSummary = "(Agent reached the max itreation without finishing)";
      console.error("[Agent] hit max intration")
    }

    await prisma.message.create({
      data: { projectId, role: "assistant", content: finalSummary }
    })

    console.log("[agent] complete")
    emitToProject(projectId, "agent:done", { summary: finalSummary })
  } catch (error) {
    console.error("[Run agent error]", error)
    emitToProject(projectId, "agent:error", { error: String(error) });
  }
}