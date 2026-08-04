import { promises as fs } from "node:fs";
import {exec} from "node:child_process"
import { promisify } from "node:util";

const execAsync = promisify(exec)

export const writeTool = {
    name : "write",
    description : "write content to the file",

    async execute(_toolCallId : string , args : {path : string , content : string}) {
        await fs.writeFile(args.path , args.content , "utf-8"); 
        return {
            content : [
                {
                    type : "text",
                    text : `Successfully wrote  to ${args.path}`
                }
            ]
        }
    }
}

export const readTool = {
    name : "read",
    description : "read the content of the file",

    async execute (
        _toolCallId : string , args : { path : string }
    ) {
        const content = await fs.readFile(args.path , "utf-8")

        return {
            content : [
                {
                    type : "text",
                    text : content,
                }
            ]
        }
    }
}
export const bashTool = {
    name : "bash",
    description : "Execute a bash command in the working directory .",

    async execute (
        _toolCallId : string , args : {command : string}
    ) {
        try {
            const {stdout , stderr}  = await execAsync(args.command);

            return {
                content : [
                    {
                        type : "text",
                        text : stdout || stderr || "(no output)",
                    },
                ],
            };
        } catch (error) {
            return {
                content : [
                    {
                        type : "text",
                        text : error instanceof Error ? error.message : "Command failed"
                    }
                ]
            }
        }
    }
}
