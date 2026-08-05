import { prisma } from "@repo/db";
import { emitToProject } from "./ws";
import { generateCode, parseFiles } from "./gemini";
import { ensureSandbox } from "./sandbox";
import { writeFiles } from "./docker";
import type OpenAI from "openai";

const TOOLS : OpenAI.Chat.ChatCompletionTool[] = [
  {
    type : "function",
    function : {
      name : "write_file",
      description : "Write or overwrite a file in the project.",
      parameters : {
        type : "object",
        properties : {
          path : {type : "string" , description : "Relative file path , e.g. src/index.ts"},
          content : {type : "string" , description : "Full file content to write"}
        },
        required : ["path" , "content"],
      },
    },
  },
  {
    type :  "function",
    function : {
      name : "read_file",
      description : "Read the current content of a file in the project.",
      parameters : {
        type : "object",
        properties : {
          path : {type : "string" , description : "Relative file path to read"},
        },
        required : ["path"]
      },
    },
  },
  {
    type : "function",
    function : {
      name : "run_command",
      description : "Run a shell command inside the sandbox (e.g. npm install , npm run build). " +
      "Returns stdout , stderr , and exit code.",
      parameters : {
        type  : "object",
        properties : {
          command : {type: "string" , description : "Shell command to execute"},
        },
        required : ["command"],
      },
    },
  },
  {
    type : "function",
    function : {
      name : "done",
      description : "signal that the task is complete . Always call this finished.",
      parameters : {
        type : "object",
        properties  : {
          summary : {
            type : "string",
            description  : "Short summary of what was done "
          },
        },
        required : ["summary"]
      }
    }
  }
]




export async function runAgent(projectId: string, userMessage: string) {
  try {
    await prisma.message.create({
      data: { projectId, role: "user", content: userMessage }
    })

    emitToProject(projectId, "agent:thinking", {})

    const existingFile = await prisma.projectFile.findMany({
      where: { projectId }
    })
   
    const stream = await generateCode(
      userMessage, existingFile.map((f) => ({ path: f.path, content: f.content }))
    )

    let fullResponse = "";

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content ?? "";

      if (!text) continue;

      fullResponse += text;

      emitToProject(projectId, "agent:token", {
        text,
      });
    }
    console.log("[A] generating files");
    const files = parseFiles(fullResponse)
    console.log("[B] parsed files", files.length);

    console.log("[C] calling ensureSandbox");

    const sandbox = await ensureSandbox(projectId)

    console.log("[D] sandbox returned", sandbox);

    for (const file of files) {
      console.log("[E] writing db file", file.path);
      if (file.path.includes("..") || file.path.startsWith('/')) {
        continue
      }


      await prisma.projectFile.upsert({
        where: { projectId_path: { projectId, path: file.path } },
        update: { content: file.content },
        create: { projectId, path: file.path, content: file.content }
      })
      console.log("[F] db write done", file.path);

      if (sandbox.containerId) {
        console.log("[G] container write", file.path);
        await writeFiles(sandbox.containerId, [{ path: file.path, content: file.content }])
        console.log("[H] container write done", file.path);
      }

      emitToProject(projectId, "file:written", { path: file.path })
    }
    console.log("[I] saving assistant message");


    await prisma.message.create({
      data: { projectId, role: "assistant", content: fullResponse }
    })
    console.log("[J] agent done");

    emitToProject(projectId, "agent:done", {})


  } catch (error) {
    console.error("[RUN AGENT ERROR]");
    console.error(error);

    emitToProject(projectId, "agent:error", {
      error: String(error),
    });
  }
}