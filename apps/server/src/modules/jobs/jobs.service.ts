import { Inject, Injectable } from "@nestjs/common";
import type { Prisma, PrismaClient } from "@prisma/client";

import type { PipelineJobPayload } from "@myrss/core";
import {
  claimOneJob,
  enqueueJob,
  heartbeatJob,
  markJobDead,
  markJobPaused,
  markJobPendingForRetry,
  markJobSucceeded,
  recoverStaleRunningJobs
} from "@myrss/db";
import type { JobType } from "@myrss/shared";

import { PrismaService } from "../prisma/prisma.service";

type DbClient = PrismaClient | Prisma.TransactionClient;

@Injectable()
export class JobsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async enqueuePipelineStepJob(
    input: PipelineJobPayload,
    prisma: DbClient = this.prisma
  ) {
    return enqueueJob(prisma, {
      workspaceId: input.workspaceId,
      type: "pipeline.step" satisfies JobType,
      payloadJson: input as unknown as Prisma.InputJsonValue,
      dedupeKey: `${input.pipelineRunId}:${input.pipelineStepRunId}`,
      pipelineRunId: input.pipelineRunId,
      pipelineStepRunId: input.pipelineStepRunId
    });
  }

  async claimNextPipelineJob(workerId: string, now: Date, staleBefore: Date) {
    return claimOneJob(this.prisma, {
      workerId,
      now,
      _staleBefore: staleBefore,
      types: ["pipeline.step"]
    });
  }

  async recoverStaleRunningJobs(staleBefore: Date) {
    return recoverStaleRunningJobs(this.prisma, staleBefore);
  }

  async heartbeatJob(
    jobId: string,
    workerId: string,
    lockVersion: number,
    at: Date
  ) {
    return heartbeatJob(this.prisma, {
      jobId,
      workerId,
      lockVersion,
      at
    });
  }

  async markJobSucceeded(
    jobId: string,
    workerId: string,
    lockVersion: number,
    finishedAt: Date
  ) {
    return markJobSucceeded(this.prisma, {
      jobId,
      workerId,
      lockVersion,
      finishedAt
    });
  }

  async markJobPendingForRetry(
    jobId: string,
    workerId: string,
    lockVersion: number,
    runAfter: Date,
    lastErrorCode?: string | null,
    lastErrorMessage?: string | null
  ) {
    return markJobPendingForRetry(this.prisma, {
      jobId,
      workerId,
      lockVersion,
      runAfter,
      lastErrorCode,
      lastErrorMessage
    });
  }

  async markJobDead(
    jobId: string,
    workerId: string,
    lockVersion: number,
    finishedAt: Date,
    lastErrorCode?: string | null,
    lastErrorMessage?: string | null
  ) {
    return markJobDead(this.prisma, {
      jobId,
      workerId,
      lockVersion,
      finishedAt,
      lastErrorCode,
      lastErrorMessage
    });
  }

  async markJobPaused(
    jobId: string,
    workerId: string,
    lockVersion: number,
    lastErrorCode?: string | null,
    lastErrorMessage?: string | null
  ) {
    return markJobPaused(this.prisma, {
      jobId,
      workerId,
      lockVersion,
      lastErrorCode,
      lastErrorMessage
    });
  }
}
