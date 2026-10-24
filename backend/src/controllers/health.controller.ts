import { Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { getTinyFishProvider } from '../providers/tinyfish/index.js';
import { getDeepSeekProvider } from '../providers/nvidia-nim/index.js';
import { imageProvider } from '../providers/image/index.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unhealthy';
  }

  res.status(dbStatus === 'healthy' ? 200 : 503).json({
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      crawler: {
        provider: 'TinyFish',
        ready: true,
      },
      textGeneration: {
        provider: 'NVIDIA NIM (DeepSeek)',
        ready: true,
      },
      imageGeneration: {
        provider: imageProvider.name,
        configured: imageProvider.isConfigured(),
      },
    },
  });
}
