import http from 'http';
import { app } from './app';
import { attachWs } from './ws';
import { prisma } from '@repo/db';
import { stopSandbox } from './sandbox';

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

attachWs(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;

setInterval(async () => {
  const stalePods = await prisma.sandboxPod.findMany({
    where: {
      status: 'running',
      lastHeartbeat: {
        lt: new Date(Date.now() - FIFTEEN_MINUTES),
      },
    },
  });

  for (const pod of stalePods) {
    await stopSandbox(pod.projectId);
    console.log(`Reaped sandbox for project ${pod.projectId}`);
  }
}, FIVE_MINUTES);