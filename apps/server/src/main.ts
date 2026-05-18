import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { loadEnv } from "@myrss/config";

import { AppModule } from "./app.module";

async function bootstrap() {
  const env = loadEnv();
  process.env.DATABASE_URL = env.DATABASE_URL;
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });

  app.setGlobalPrefix("api/v1");

  await app.listen(env.PORT, "0.0.0.0");

  console.log(`Server listening on http://localhost:${env.PORT}`);
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
