import Dockerode from "dockerode";

const docker = new Dockerode({
    socketPath : '/var/run/docker.sock'
})

export async function createAndStart(projectId :any , port  : any) {
    console.log("createandstart sandbox")

    try {
        const name = `container-${projectId}`;

        try {
            await docker.getContainer(name).remove({force : true});

        } catch (error : any) {
            if(error.statusCode !== 404) throw error;
        }

        const images = await docker.listImages();
        console.log("B Image :" , images.flatMap(img =>  img.RepoTags || [])
    );

    console.log("C about to create container");

    const container = await docker.createContainer({
        Image : "sandbox-base",
        name ,
        Tty : true,
        ExposedPorts : {
            "5173/tcp" : {},
        },
        HostConfig : {
            PortBindings : {
                "5173/tcp" : [{HostPort : String(port)}],
            },
            Memory : 512 * 1024 * 1024,
            NanoCpus : 0.5 * 1e9,
        },
    });

    console.log("D Container created" , container.id)

    await container.start();

    console.log("E Container started");

    return container.id;
    } catch (err) {
        console.error("Error createAndStart" , err);
        throw err;
    }
}

export async function stopContainer(containerId :any) {
    try {
        await docker.getContainer(containerId).stop()
    } catch (error : any) {
        if(error.statusCode !== 304) throw error
    }
}

export async function removeContainer(containerId : any) {
    await docker.getContainer(containerId).remove({force : true})
}

export async function exec(containerId :any , cmd :string[]) : Promise<string> {
    console.log("exec running" , cmd);

    const container = docker.getContainer(containerId)

    const execObj = await container.exec({
        Cmd :  cmd,
        AttachStdout : true,
        AttachStderr : true,
    })
    console.log("exex Exec object created");

    const stream =  await execObj.start({stdin : false})

    console.log("exec stream started")

    return new Promise((resolve , reject) => {
        let output = "";
        stream.on('data' , (chunk :Buffer) => {
            output += chunk.toString("utf-8")
        })
        stream.on("end", () => resolve(output))
        stream.on("error", reject)
    })
}

export type ExecResult = {
    stdout : string;
    stderr : string;
    exitCode : number;
}

export async function execInContainer(
  containerId: string,
  command: string
): Promise<ExecResult> {
  console.log("[execInContainer]", command);
 
  const container = docker.getContainer(containerId);
 
  const execObj = await container.exec({
    Cmd: ["sh", "-c", command],
    AttachStdout: true,
    AttachStderr: true,
  });
 
  const stream = await execObj.start({ stdin: false });
 
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
 
    stream.on("data", (chunk: Buffer) => {
      if (chunk.length < 8) {
        stdout += chunk.toString("utf-8");
        return;
      }
      const streamType = chunk[0]; 
      const payload = chunk.slice(8).toString("utf-8");
      if (streamType === 2) {
        stderr += payload;
      } else {
        stdout += payload;
      }
    });
 
    stream.on("end", async () => {
      try {
        const inspect = await execObj.inspect();
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: inspect.ExitCode ?? 0,
        });
      } catch {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 });
      }
    });
 
    stream.on("error", reject);
  });
}
 
export async function writeFiles(
  containerId: string,
  files: { path: string; content: string }[]
) {
  for (const file of files) {
    const dir = file.path.includes("/")
      ? file.path.substring(0, file.path.lastIndexOf("/"))
      : null;
 
    if (dir) {
      await exec(containerId, ["mkdir", "-p", `/app/${dir}`]);
    }
 
    await exec(containerId, [
      "sh",
      "-c",
      `cat > /app/${file.path} << 'EOF'\n${file.content}\nEOF`,
    ]);
  }
}
 

export async function readFile(
  containerId: string,
  path: string
): Promise<string | null> {
  console.log("[readFile]", path);
 
  try {
    const result = await execInContainer(containerId, `cat /app/${path}`);
 
    
    if (result.exitCode !== 0) return null;
 
    return result.stdout || null;
  } catch {
    return null;
  }
}
