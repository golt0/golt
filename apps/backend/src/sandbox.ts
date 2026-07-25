import { prisma } from "@repo/db";
import { createAndStart, stopContainer, writeFiles } from "./docker";
import net from "net"

export async function ensureSandbox(projectId : string) {
    const existing = await prisma.sandboxPod.findUnique({
        where : {projectId}
    })

    if(existing && existing.status === "running") {
        return existing;
    }

    if(!existing) {
        const sandboxPod = await prisma.sandboxPod.upsert({
          where : {projectId},
          update : {status : 'creating'},
          create : {projectId, status : 'creating'}

        })
    }

    const port = await findFreePort(4000, 5000);
    const containerId = await createAndStart(projectId, port);

    const files =  await prisma.projectFile.findMany({
        where : {projectId}
    })

    await writeFiles(containerId , files)

    const pod = await prisma.sandboxPod.update({
        where : {projectId},
        data : {
            status : "running",
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

