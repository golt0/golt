import Dockerode from "dockerode";

    const docker = new Dockerode({
       socketPath : '/var/run/docker.sock'
    })

export async function createAndStart(projectId: any, port: any) {
  console.log("[A] createAndStart");

  try {
    const images = await docker.listImages();
    console.log(
      "[B] Images:",
      images.flatMap(img => img.RepoTags || [])
    );

    console.log("[C] About to create container");

    const container = await docker.createContainer({
      Image: "sandbox-base",
      name: `container-${projectId}`,
      Tty: true,
      ExposedPorts: {
        "5173/tcp": {},
      },
      HostConfig: {
        PortBindings: {
          "5173/tcp": [{ HostPort: String(port) }],
        },
        Memory: 512 * 1024 * 1024,
        NanoCpus: 0.5 * 1e9,
      },
    });

    console.log("[D] Container created", container.id);

    await container.start();

    console.log("[E] Container started");

    return container.id;
  } catch (err) {
    console.error("[ERROR createAndStart]", err);
    throw err;
  }
}

export async function stopContainer(containerId : any) {
   await docker.getContainer(containerId).stop()
}

export async function removeContainer(containerId : any) {
   await docker.getContainer(containerId).remove({force : true})
}

export async function exec(containerId : any , cmd : string[]) : Promise<string> {
    console.log("[EXEC] Running", cmd);

    const contanier = docker.getContainer(containerId)

    const exec = await contanier.exec({
        Cmd : cmd,
        AttachStdout : true,
        AttachStderr: true,
    })
      console.log("[EXEC] Exec object created");

    const stream = await exec.start({ stdin : false})

    console.log("[EXEC] Stream started");

    return new Promise((resolve ,reject) => {
        let output = '';
        stream.on('data', (chunk: Buffer) => {
            output += chunk.toString('utf-8');
        });
        stream.on("end" , () => resolve(output))
        stream.on('error', reject)
    });
}

export async function writeFiles(containerId : string , files : {path : string, content : string}[]) {
    for(const file of files) {
        const dir = file.path.includes('/')
        ?  file.path.substring(0, file.path.lastIndexOf('/'))
        : null;
        if(dir) {
            await exec(containerId, ['mkdir' , '-p', `/app/${dir}`]);
        }

        await exec (containerId, [
            'sh' , '-c',
            `cat > /app/${file.path} << 'EOF'\n${file.content}\nEOF`,
        ]);
    }
}



