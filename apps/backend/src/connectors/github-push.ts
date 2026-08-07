import { prisma } from "@repo/db";
import { getGithubToken } from "./github";

interface  GithubUser {
    login : string
}

interface GithubContent {
    sha : string
}


export async function pushProjectToGithub(ownerId : string , projectId : string, repoName : string) {
    const token = await getGithubToken(ownerId);
    if(!token) throw new Error("github not connected")

        const headers = {
            Authorization : `Bearer ${token}`,
            Accept : "application/vnd.github+json",
        };

        const createRes = await fetch("https://api.github.com/user/repos", {
            method : "POST",
            headers : {...headers , "Content-Type" : "application/json"},
            body : JSON.stringify({name: repoName , private : true}),
        });
        if(!createRes.ok  && createRes.status !== 422) {
            throw new Error(`Failed to create repo : ${await createRes.text()}`);
        }

        const meRes = await fetch("https://api.github.com/user" , {headers});
        const {login} = await meRes.json() as GithubUser;

        const files = await prisma.projectFile.findMany({where : {projectId}});

        const failure : {path : string , error : string}[] = []

        for(const file of files) {

            const contentUrl = `https://api.github.com/repos/${login}/${repoName}/contents/${encodeURIComponent(file.path)}`;

            let sha : string | undefined;
            const getRes = await fetch(contentUrl, { method : "GET", headers });
            if(getRes.ok) {
                const existing = await getRes.json() as GithubContent;
                sha = existing.sha;
            } else if(getRes.status !== 404) {
                failure.push({path : file.path , error : await getRes.text()});
                continue;
            }

            const putRes = await fetch(contentUrl, {
            method : "PUT",
            headers : {...headers , "Content-Type" : "application/json"},
            body :  JSON.stringify({
                message : `sync  : ${file.path}`,
                content : Buffer.from(file.content).toString("base64"),
                ...(sha && {sha}),
            })
        });

            if(!putRes.ok) {
                failure.push({path : file.path , error : await putRes.text()});
            }
        }
   return {repoUrl : `https://github.com/${login}/${repoName}` , failure};
}