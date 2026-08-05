import { prisma } from "@repo/db";
import { emitToProject } from "./ws";
import { ensureSandbox } from "./sandbox";
import { askLLM, assistantMessage, toolResultMessage } from "./gemini";
import { TOOL_DEFINITIONS, executeTool } from "./tools";

 

const MAX_ITERATIONS = 10;

export async function runAgent(projectId : string , userMessage : string) {
  try {
    await prisma.message.create({
      data : {projectId , role : "user" , content : userMessage}
    });

    emitToProject(projectId , "agent:thinking" , {});

    const existingFile = await prisma.projectFile.findMany({
      where : {projectId}
    })

    const sandbox = await ensureSandbox(projectId)
    const containerId = sandbox.containerId ?? null;

    const messages: any[] = [
      {
        role: "system",
        content: [
          "You are an expert coding agent. Use tools to complete the task.",
          "Always call `done` when finished.",
          existingFile.length
            ? `Existing files:\n${existingFile.map((f) => `  - ${f.path}`).join("\n")}`
            : "No files yet — fresh project.",
        ].join("\n"),
      },
      {
        role: "user",
        content: userMessage,
      },
    ];


    let iteration = 0;
    let finalSummary = "";
    let isDone = false;


    while(iteration < MAX_ITERATIONS && !isDone) {
          iteration++;
          console.log(`iteration ${iteration}`)

          const {toolCalls, text} = await askLLM(messages ,TOOL_DEFINITIONS);

          if(text) {
            emitToProject(projectId , "agent:thinking" , {text})
          }

          if(toolCalls.length === 0) {
            finalSummary = text;
            break
          }

          messages.push(assistantMessage(text ,toolCalls))

          for(const call of toolCalls) {
             console.log(`[AGENT] calling tool: ${call.name}`);
             emitToProject(projectId , "agent:tool_call" , {tool : call.name , args : call.args})

             if(call.name === "done") {
                finalSummary = (call.args as {summary : string}).summary ?? "";
                isDone = true;

                messages.push(toolResultMessage(call.id , "acknowlage"))

                break
             }

             const result = await executeTool(call.name , call.args , projectId , containerId);
             console.log(`[agent] ${call.name} result:` , result.slice(0 , 120));

             emitToProject(projectId , "agent:too_result" , {tool : call.name , result : result.slice(0 , 500)});

             messages.push(toolResultMessage(call.id , result))
          }
    }

    if(!isDone && !finalSummary) {
      finalSummary = "(Agent reached the max itreation without finishing)";
      console.warn("[Agent] hit max intration")
    }

    await prisma.message.create({
      data : {projectId , role : "assistant" , content : finalSummary}
    })

    console.log("[agent] complete")
    emitToProject(projectId , "agent:done" , {summary: finalSummary})
  } catch (error) {
      console.error("[Run agent error]" , error)
      emitToProject(projectId, "agent:error", { error: String(error) });
  }
}