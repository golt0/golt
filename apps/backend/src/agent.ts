import { prisma } from "@repo/db";
import { emitToProject } from "./ws";
import { generateCode, parseFiles } from "./gemini";
import { ensureSandbox } from "./sandbox";
import { writeFiles } from "./docker";

export async function runAgent(projectId : string, userMessage : string) {
    try {
        await prisma.message.create({
            data : {projectId, role : "user", content : userMessage}
        })

        emitToProject(projectId, "agent:thinking" , {})

        const existingFile = await prisma.projectFile.findMany({
            where : {projectId}
        })

        const stream = await generateCode(
          userMessage, existingFile.map((f) =>  ({path : f.path , content : f.content}))
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

        const files  = parseFiles(fullResponse)

        const sandbox = await ensureSandbox(projectId)

        for  (const file of files) {
           if(file.path.includes("..") || file.path.startsWith('/')) {
            continue
           }
        

        await prisma.projectFile.upsert({
            where : {projectId_path : {projectId,  path : file.path}},
            update : {content : file.content },
            create : {projectId , path : file.path , content : file.content}
        })

        if(sandbox.containerId) {
          await  writeFiles(sandbox.containerId, [{path : file.path ,content : file.content }])
        }

        emitToProject(projectId , "file:written" , {path :file.path})
    }

    await prisma.message.create({
        data : {projectId , role : "assistant", content :fullResponse}
    })

    emitToProject(projectId , "agent:done" , {})


    } catch (error) {
       console.error(error)
    }
}