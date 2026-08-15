import { Router } from "express";
import { requireAuth } from "./middlewares/auth.middleware";
import { prisma } from "@repo/db";

const router = Router();

router.get("/:projectId/files" , requireAuth , async (req , res, next) => {
    try {
        const ownerId  = (req as any).ownerId as string;
        const {projectId} = req.params;
    
        const project = await prisma.project.findUnique({
            where: {id : projectId}
        })
    
        if(!project || project.ownerId !== ownerId) {
            return res.status(400).json({
                error : "project was not found"
            })
        }
    
        const files = await prisma.projectFile.findMany({
            where :  {projectId} 
        })
    
        return res.status(200).json({files})
    } catch (error) {
        next(error)
    }
})

router.put("/:projectId/files", requireAuth, async (req , res , next) => {
  try {
      const ownerId = (req as any).ownerId as string;
      const {projectId} = req.params as {projectId : string};
      const {path , content} =  req.body as {path : string , content : string};
      
      if(!path ||!content) {
          return res.status(400).json({error :  "path and content both required"})
      }
  
      if(path.includes("..") ||  path.startsWith("/")){
          return res.status(400).json({
              error : "invalid path"
          })
      }
      const file = await prisma.projectFile.upsert({
          where : {
              projectId_path: {projectId , path}
          },
          update : {content},
          create : {projectId , path, content},
      })
      return res.status(200).json({file})
  } catch (error) {
    next(error)
  }
})

router.delete("/:projectId/files" , requireAuth, async (req, res, next) => {
  try {
      const ownerId = (req as any).ownerId as string;
      const {projectId} = req.params as {projectId : string};
  
      const {path} = req.body as {path : string};
  
      const project = await prisma.project.findUnique({
          where : {id : projectId}
      });
  
      if(!project || project.ownerId !== ownerId) {
          return res.status(400).json({
              error : "project not found"
          })
      }
  
      if(!path) {
          return res.status(400).json({
              error : "path required"
          })
      }
       await prisma.projectFile.delete({
          where : {projectId_path: {projectId , path}}
      })
  
      return res.status(200).json({
          error : "deleted successfully"
      })
  } catch (error) {
    next(error)
  }
})

export default router;
