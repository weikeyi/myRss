import type { Prisma, PrismaClient } from "@prisma/client";

import type { JobType } from "@myrss/shared";

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface PipelineJobPayloadRecord {
  articleId: string;
  pipelineRunId: string;
  pipelineStepRunId: string;
  stepKey: string;
  stepType: string;
  trigger: string;
  workspaceId: string;
}

export class JobLockLostError extends Error {
  constructor() {
    super("Job lock lost");
    this.name = "JobLockLostError";
  }
}

export interface EnqueueJobInput {
  workspaceId: string;
  type: JobType;
  payloadJson: Prisma.InputJsonValue;
  dedupeKey?: string | null;
  priority?: number;
  runAfter?: Date;
  maxAttempts?: number;
  pipelineRunId?: string | null;
  pipelineStepRunId?: string | null;
}

export async function enqueueJob(prisma: DbClient, input: EnqueueJobInput) {
  return prisma.job.create({
    data: {
      workspaceId: input.workspaceId,
      type: input.type,
      payloadJson: input.payloadJson,
      dedupeKey: input.dedupeKey ?? null,
      priority: input.priority ?? 0,
      runAfter: input.runAfter ?? new Date(),
      maxAttempts: input.maxAttempts ?? 3,
      pipelineRunId: input.pipelineRunId ?? null,
      pipelineStepRunId: input.pipelineStepRunId ?? null
    }
  });
}

export async function recoverStaleRunningJobs(
  prisma: DbClient,
  staleBefore: Date
) {
  return prisma.job.updateMany({
    where: {
      status: "running",
      lockedAt: {
        lt: staleBefore
      }
    },
    data: {
      status: "pending",
      lockedAt: null,
      lockedBy: null,
      heartbeatAt: null
    }
  });
}

export async function claimOneJob(
  prisma: PrismaClient,
  input: {
    workerId: string;
    now: Date;
    _staleBefore: Date;
    types?: JobType[];
  }
) {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.job.findFirst({
      where: {
        status: "pending",
        runAfter: {
          lte: input.now
        },
        ...(input.types ? { type: { in: input.types } } : {})
      },
      orderBy: [
        {
          priority: "desc"
        },
        {
          runAfter: "asc"
        },
        {
          createdAt: "asc"
        }
      ]
    });

    if (!candidate) {
      return null;
    }

    const updated = await tx.job.updateMany({
      where: {
        id: candidate.id,
        status: "pending",
        runAfter: {
          lte: input.now
        }
      },
      data: {
        status: "running",
        lockedAt: input.now,
        lockedBy: input.workerId,
        lockVersion: {
          increment: 1
        },
        heartbeatAt: input.now,
        startedAt: candidate.startedAt ?? input.now,
        attempts: {
          increment: 1
        }
      }
    });

    if (updated.count !== 1) {
      return null;
    }

    return tx.job.findUnique({
      where: {
        id: candidate.id
      }
    });
  });
}

function assertJobLock(jobId: string, count: number) {
  if (count !== 1) {
    throw new JobLockLostError();
  }
}

export async function heartbeatJob(
  prisma: DbClient,
  input: {
    jobId: string;
    workerId: string;
    lockVersion: number;
    at: Date;
  }
) {
  const updated = await prisma.job.updateMany({
    where: {
      id: input.jobId,
      status: "running",
      lockedBy: input.workerId,
      lockVersion: input.lockVersion
    },
    data: {
      heartbeatAt: input.at
    }
  });

  assertJobLock(input.jobId, updated.count);
}

export async function markJobSucceeded(
  prisma: DbClient,
  input: {
    jobId: string;
    workerId: string;
    lockVersion: number;
    finishedAt: Date;
  }
) {
  const updated = await prisma.job.updateMany({
    where: {
      id: input.jobId,
      status: "running",
      lockedBy: input.workerId,
      lockVersion: input.lockVersion
    },
    data: {
      status: "succeeded",
      finishedAt: input.finishedAt,
      lockedAt: null,
      lockedBy: null,
      heartbeatAt: null
    }
  });

  assertJobLock(input.jobId, updated.count);
}

export async function markJobPendingForRetry(
  prisma: DbClient,
  input: {
    jobId: string;
    workerId: string;
    lockVersion: number;
    runAfter: Date;
    lastErrorCode?: string | null;
    lastErrorMessage?: string | null;
  }
) {
  const updated = await prisma.job.updateMany({
    where: {
      id: input.jobId,
      status: "running",
      lockedBy: input.workerId,
      lockVersion: input.lockVersion
    },
    data: {
      status: "pending",
      runAfter: input.runAfter,
      lockedAt: null,
      lockedBy: null,
      heartbeatAt: null,
      lastErrorCode: input.lastErrorCode ?? null,
      lastErrorMessage: input.lastErrorMessage ?? null
    }
  });

  assertJobLock(input.jobId, updated.count);
}

export async function markJobDead(
  prisma: DbClient,
  input: {
    jobId: string;
    workerId: string;
    lockVersion: number;
    finishedAt: Date;
    lastErrorCode?: string | null;
    lastErrorMessage?: string | null;
  }
) {
  const updated = await prisma.job.updateMany({
    where: {
      id: input.jobId,
      status: "running",
      lockedBy: input.workerId,
      lockVersion: input.lockVersion
    },
    data: {
      status: "dead",
      finishedAt: input.finishedAt,
      lockedAt: null,
      lockedBy: null,
      heartbeatAt: null,
      lastErrorCode: input.lastErrorCode ?? null,
      lastErrorMessage: input.lastErrorMessage ?? null
    }
  });

  assertJobLock(input.jobId, updated.count);
}

export async function markJobPaused(
  prisma: DbClient,
  input: {
    jobId: string;
    workerId: string;
    lockVersion: number;
    lastErrorCode?: string | null;
    lastErrorMessage?: string | null;
  }
) {
  const updated = await prisma.job.updateMany({
    where: {
      id: input.jobId,
      status: "running",
      lockedBy: input.workerId,
      lockVersion: input.lockVersion
    },
    data: {
      status: "paused",
      lockedAt: null,
      lockedBy: null,
      heartbeatAt: null,
      lastErrorCode: input.lastErrorCode ?? null,
      lastErrorMessage: input.lastErrorMessage ?? null
    }
  });

  assertJobLock(input.jobId, updated.count);
}

export function isPipelineJobPayload(
  payload: unknown
): payload is PipelineJobPayloadRecord {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "pipelineRunId" in payload &&
    "pipelineStepRunId" in payload &&
    "articleId" in payload &&
    "stepKey" in payload &&
    "stepType" in payload &&
    "workspaceId" in payload
  );
}
