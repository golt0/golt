import { prisma } from "@repo/db";
import { createAndStart, stopContainer, writeFiles } from "./docker";
import net from "net"

export async function ensureSandbox(projectId : string) {
    console.log("[1] ensureSandbox", projectId);
    const existing = await prisma.sandboxPod.findUnique({
        where : {projectId}
        
    })

     console.log("[2] existing", existing);

    if(existing && existing.status === "running" ||existing?.status === "creating") {
        return existing;
    }

     await prisma.sandboxPod.upsert({
      where: { projectId },
      update: { status: 'creating' },
      create: { projectId, status: 'creating' }
   })

    const port = await findFreePort(4000, 5000);
    console.log("[3] port", port);
    console.log("[CREATING CONTAINER]", projectId);
    const containerId = await createAndStart(projectId, port);
    console.log("[4] containerId", containerId);


    const files =  await prisma.projectFile.findMany({
        where : {projectId}
    })
    console.log("[5] files", files.length);

    await writeFiles(containerId , files)
    console.log("[6] files written");
    const pod = await prisma.sandboxPod.update({
        where : {projectId},
        data : {
            status : "running",
            // previewUrl: `http://localhost:${port}`,
            containerId,
            lastHeartbeat : new Date()
        }

    })

    await prisma.project.update({
        where : {id :projectId},
        data : {previewUrl : `http://localhost:${port}`}
    })
    return pod;
}


export async function findFreePort(start :any , end : any) {
    for(let port = start ; port <= end; port++) {
        const free = await new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port , () => {
                server.close(() => resolve(true))
            });
            server.on('error' , () => resolve(false))
        })

        if(free) return port;
    }
    throw new Error(`No free port found between ${start} and ${end}`)
}

export async function stopSandbox(projectId :string) {
    const sandboxPod = await prisma.sandboxPod.findUnique({
        where : {projectId}
    })

    if(!sandboxPod || !sandboxPod.containerId) {
       return 
    }

    await stopContainer(sandboxPod.containerId);

    await prisma.sandboxPod.update({
        where : {projectId},
        data : {status : 'stopped'}
    })
}

export async function heartbeat(projectId : string) {
    await prisma.sandboxPod.update({
        where : {projectId},
        data : {lastHeartbeat : new Date()}
    })
}

