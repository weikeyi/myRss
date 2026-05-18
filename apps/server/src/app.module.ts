import { Module } from "@nestjs/common";

import { ConfigRuntimeModule } from "./modules/config/config.module";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { WorkspaceModule } from "./modules/workspace/workspace.module";

@Module({
  imports: [ConfigRuntimeModule, HealthModule, PrismaModule, WorkspaceModule]
})
export class AppModule {}
