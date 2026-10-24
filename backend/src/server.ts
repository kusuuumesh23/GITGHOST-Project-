import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './db/prisma.js';
import { localStorageAdapter } from './providers/image/local-storage.adapter.js';

import { publishDueScheduledPosts } from './services/posting.service.js';

let server: ReturnType<typeof app.listen> | null = null;
let scheduleTimer: NodeJS.Timeout | null = null;

async function startServer(): Promise<void> {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // 2. Ensure Asset Storage Directory
    await localStorageAdapter.ensureDirectory();

    // 3. Start Express HTTP Server
    server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          apiPrefix: '/api/v1',
        },
        `🚀 PostDaily Backend Server is running at http://localhost:${env.PORT}`
      );
    });

    // 4. Start Scheduler for Due Posts (runs every 60 seconds)
    scheduleTimer = setInterval(async () => {
      try {
        await publishDueScheduledPosts();
      } catch (err) {
        logger.error({ err }, 'Error in publishDueScheduledPosts cron worker');
      }
    }, 60000);

    // Handle process signals for graceful shutdown
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      if (scheduleTimer) clearInterval(scheduleTimer);
      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed');
          await disconnectDatabase();
          process.exit(0);
        });
      } else {
        await disconnectDatabase();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error({ error }, '❌ Fatal startup error');
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

startServer();
