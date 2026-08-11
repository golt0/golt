import { Sandbox } from "e2b";

const TEMPLATE = "sandbox-base";
const SANDBOX_TIMEOUT_MS = 15 * 60 * 1000; 

async function getSandbox(sandboxId: string): Promise<Sandbox> {
    return Sandbox.connect(sandboxId);
}

export async function createAndStart(projectId: string) {
    try {
        const sandbox = await Sandbox.create(TEMPLATE, {
            metadata: {
                projectId,
            },
            timeoutMs: SANDBOX_TIMEOUT_MS,
        });

        return sandbox.sandboxId;
    } catch (error) {
        console.error("Error creating sandbox:", error);
        throw error;
    }
}

export async function stopContainer(containerId: string) {
    try {
        const sandbox = await getSandbox(containerId);
        await sandbox.kill();
    } catch (error) {
        console.error("Error stopping sandbox:", error);
    }
}

export async function runInBackground(
    containerId: string,
    command: string
): Promise<void> {
    const sandbox = await getSandbox(containerId);

    await sandbox.commands.run(command, { background: true });
}

export type ExecResult = {
    stdout: string;
    stderr: string;
    exitCode: number;
};

export async function execInContainer(
    containerId: string,
    command: string
): Promise<ExecResult> {
    const sandbox = await getSandbox(containerId);

    const result = await sandbox.commands.run(command);

    return {
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim(),
        exitCode: result.exitCode ?? 0,
    };
}

export async function writeFiles(
    containerId: string,
    files: { path: string; content: string }[]
) {
    const sandbox = await getSandbox(containerId);

    for (const file of files) {
        await sandbox.files.write(`/app/${file.path}`, file.content);
    }
}

export async function readFile(
    containerId: string,
    path: string
): Promise<string | null> {
    try {
        const sandbox = await getSandbox(containerId);
        const content = await sandbox.files.read(`/app/${path}`);

        return content || null;
    } catch {
        return null;
    }
}
