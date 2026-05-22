import { Module } from "@nestjs/common";

import { ArticlesModule } from "./modules/articles/articles.module";
import { ConfigRuntimeModule } from "./modules/config/config.module";
import { HealthModule } from "./modules/health/health.module";
import { PipelineModule } from "./modules/pipeline/pipeline.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { WorkspaceModule } from "./modules/workspace/workspace.module";

@Module({
  imports: [
    ConfigRuntimeModule,
    HealthModule,
    PrismaModule,
    WorkspaceModule,
    PipelineModule,
    ArticlesModule
  ]
})
export class AppModule {}
