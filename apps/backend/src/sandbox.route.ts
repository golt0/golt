import { Router } from "express";
import { prisma } from "@repo/db";
import { requireAuth } from "./middlewares/auth.middleware";
import { ensureSandbox } from "./sandbox";

const router = Router();

router.post("/:projectId/sandbox", requireAuth, async (req, res, next) => {
  try {
    const ownerId = (req as any).ownerId as string;
    const { projectId } = req.params as { projectId: string };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.ownerId !== ownerId) {
      return res.status(404).json({ error: "project not found" });
    }

    const pod = await ensureSandbox(projectId);

    const updated = await prisma.project.findUnique({
      where: { id: projectId },
    });

    return res.status(200).json({
      status: pod.status,
      previewUrl: updated?.previewUrl ?? null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
