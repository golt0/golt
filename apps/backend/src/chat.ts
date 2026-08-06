import { Router } from "express";
import { requireAuth } from "./middlewares/auth.middleware";
import { prisma } from "@repo/db";
import { runAgent } from "./agent";

const router = Router();

router.post("/:projectId/messages", requireAuth , async (req , res) => {
    const ownerId = (req as any).ownerId  as string;
    const projectId = req.params.projectId  as string;

   const project = await prisma.project.findUnique({
        where : {id : projectId}
    })

    if(!project || project.ownerId !== ownerId) {
        return  res.status(400).json({error : "user not found"})
    }

    const message = req.body.message;
    if(!message) {
        return res.status(400).json({error : "message is required"})
    }

    runAgent(projectId , message)

    return res.status(200).json({status : "ok"})
    
})

router.get("/:projectId/messages", requireAuth, async(req , res) => {
    const ownerId   = (req).ownerId as string;
    const projectId = req.params.projectId  as string;

    const project = await prisma.project.findUnique({
        where : {id : projectId}
    })

    if(!project) {
        return res.status(400).json({error : "project is not found"})
    }

    const messages = await prisma.message.findMany({
        where : {projectId},
        orderBy : {createdAt : "asc"}
    })

    return res.status(200).json({messages})

})

export default router;