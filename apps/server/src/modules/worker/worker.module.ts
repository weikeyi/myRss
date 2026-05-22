import { Module } from "@nestjs/common";

import { JobsModule } from "../jobs/jobs.module";
import { PipelineModule } from "../pipeline/pipeline.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { WorkerService } from "./worker.service";

@Module({
  imports: [PrismaModule, WorkspaceModule, JobsModule, PipelineModule],
  providers: [WorkerService],
  exports: [WorkerService]
})
export class WorkerModule {}
