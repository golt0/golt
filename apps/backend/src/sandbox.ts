import { prisma } from "@repo/db";
import { createAndStart, runInBackground, stopContainer, writeFiles } from "./e2b";
import { Sandbox } from "e2b";

const inFlight = new Map<string, Promise<Awaited<ReturnType<typeof createSandbox>>>>();

export function ensureSandbox(projectId : string) {
    const pending = inFlight.get(projectId);
    if (pending) return pending;

    const promise = createSandbox(projectId).finally(() => {
        inFlight.delete(projectId);
    });
    inFlight.set(projectId, promise);
    return promise;
}

async function createSandbox(projectId : string) {
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

    console.log("[CREATING SANDBOX]", projectId);
    const containerId = await createAndStart(projectId);
    console.log("[3] containerId", containerId);


    const files =  await prisma.projectFile.findMany({
        where : {projectId}
    })
    console.log("[4] files", files.length);

    await writeFiles(containerId , files)
    console.log("[5] files written");
    await runInBackground(
        containerId,
        "cd /app && bun run dev -- --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1"
    );
    console.log("[6] Vite started");

    const sandbox = await Sandbox.connect(containerId);
    const previewUrl = `https://${sandbox.getHost(5173)}`;
    console.log("[7] previewUrl", previewUrl);

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
        data : {previewUrl}
    })
    return pod;
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
