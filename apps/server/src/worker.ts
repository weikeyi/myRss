import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { loadEnv } from "@myrss/config";

import { WorkerModule } from "./modules/worker/worker.module";
import { WorkerService } from "./modules/worker/worker.service";

async function bootstrap() {
  const env = loadEnv();
  process.env.DATABASE_URL = env.DATABASE_URL;

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true
  });

  const worker = app.get(WorkerService);
  await worker.start();

  const shutdown = async () => {
    await worker.stop();
    await app.close();
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
