import Dockerode from "dockerode";

    const docker = new Dockerode({
       socketPath : 'var/run/docker.sock'
    })

export async function createAndStart(projectId : any, port: any) {
   const container = await docker.createContainer({
    Image : "sandbox-base",
    name : `container-${projectId}`,
    // TeleTypewrite ek terminal hai if false automatically 
    // band hojata hai if it is true container chalta rehta hai 
    // baad me bi
    Tty : true,
    ExposedPorts : {'5173/tcp' : {}}, // sandbox ke andar konsa port chal raha hai
    HostConfig : { 
        PortBindings : {
            '5173/tcp' : [{ HostPort : String(port)}] // vo sandbox kisport pe chal raha hai
        },
        Memory : 512 * 1024 * 1024, // memory
        NanoCpus: 0.5 * 1e9, // cup
     }
   })
   await container.start()

   return container.id;
}

export async function stopContainer(containerId : any) {
   await docker.getContainer(containerId).stop()
}

export async function removeContainer(containerId : any) {
   await docker.getContainer(containerId).remove({force : true})
}

export async function exec(containerId : any , cmd : string[]) : Promise<string> {
    const contanier = docker.getContainer(containerId)

    const exec = await contanier.exec({
        Cmd : cmd,
        AttachStdout : true,
        AttachStderr: true,
    })

    const stream = await exec.start({hijack : true , stdin : false})

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



