import { Module } from "@nestjs/common";

import { JobsModule } from "../jobs/jobs.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { PipelineController } from "./pipeline.controller";
import { PipelineService } from "./pipeline.service";
import { FetchFulltextStep } from "./steps/fetch-fulltext.step";

@Module({
  imports: [PrismaModule, WorkspaceModule, JobsModule],
  controllers: [PipelineController],
  providers: [PipelineService, FetchFulltextStep],
  exports: [PipelineService]
})
export class PipelineModule {}
