import { Module } from "@nestjs/common";

import { PipelineModule } from "../pipeline/pipeline.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { ArticlesController } from "./articles.controller";
import { ArticlesService } from "./articles.service";

@Module({
  imports: [PrismaModule, WorkspaceModule, PipelineModule],
  controllers: [ArticlesController],
  providers: [ArticlesService]
})
export class ArticlesModule {}
