import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  pipelineStepStatuses,
  PipelineRun,
  PipelineStepRun
} from "@myrss/shared";

type DbClient = PrismaClient | Prisma.TransactionClient;

type PipelineRunRow = Prisma.PipelineRunGetPayload<{
  include: {
    steps: true;
  };
}>;

type PipelineStepRunRow = Prisma.PipelineStepRunGetPayload<Record<string, never>>;

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function mapStep(step: PipelineStepRunRow): PipelineStepRun {
  return {
    id: step.id,
    pipelineRunId: step.pipelineRunId,
    stepKey: step.stepKey,
    stepType: step.stepType as PipelineStepRun["stepType"],
    stepIndex: step.stepIndex,
    status: step.status as PipelineStepRun["status"],
    attempts: step.attempts,
    maxAttempts: step.maxAttempts,
    required: step.required,
    inputJson: (step.inputJson as Record<string, unknown> | null) ?? null,
    outputJson: (step.outputJson as Record<string, unknown> | null) ?? null,
    errorCode: step.errorCode,
    errorMessage: step.errorMessage,
    skippedReason: step.skippedReason,
    startedAt: toIsoString(step.startedAt),
    finishedAt: toIsoString(step.finishedAt)
  };
}

function mapRun(run: PipelineRunRow): PipelineRun {
  return {
    id: run.id,
    articleId: run.articleId,
    workflowConfigId: run.workflowConfigId,
    workflowVersion: run.workflowVersion,
    status: run.status as PipelineRun["status"],
    trigger: run.trigger,
    currentStepKey: run.currentStepKey,
    errorCode: run.errorCode,
    errorMessage: run.errorMessage,
    startedAt: toIsoString(run.startedAt),
    finishedAt: toIsoString(run.finishedAt),
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    steps: run.steps
      .slice()
      .sort((a, b) => a.stepIndex - b.stepIndex)
      .map(mapStep)
  };
}

export async function createPipelineRun(
  prisma: DbClient,
  input: {
    workspaceId: string;
    articleId: string;
    workflowConfigId: string | null;
    workflowVersion: number;
    workflowSnapshotJson: Prisma.InputJsonValue;
    trigger: string;
    currentStepKey: string | null;
    startedAt: Date;
  }
) {
  return prisma.pipelineRun.create({
    data: {
      workspaceId: input.workspaceId,
      articleId: input.articleId,
      workflowConfigId: input.workflowConfigId,
      workflowVersion: input.workflowVersion,
      workflowSnapshotJson: input.workflowSnapshotJson,
      trigger: input.trigger,
      status: "running",
      currentStepKey: input.currentStepKey,
      startedAt: input.startedAt
    }
  });
}

export async function createPipelineStepRun(
  prisma: DbClient,
  input: {
    workspaceId: string;
    articleId: string;
    pipelineRunId: string;
    stepKey: string;
    stepType: string;
    stepIndex: number;
    status: (typeof pipelineStepStatuses)[number];
    required: boolean;
    maxAttempts?: number;
    inputJson?: Prisma.InputJsonValue | null;
  }
) {
  return prisma.pipelineStepRun.create({
    data: {
      workspaceId: input.workspaceId,
      articleId: input.articleId,
      pipelineRunId: input.pipelineRunId,
      stepKey: input.stepKey,
      stepType: input.stepType,
      stepIndex: input.stepIndex,
      status: input.status,
      required: input.required,
      maxAttempts: input.maxAttempts ?? 1,
      inputJson: input.inputJson ?? undefined
    }
  });
}

export async function getLatestPipelineRunForArticle(
  prisma: DbClient,
  workspaceId: string,
  articleId: string
) {
  const run = await prisma.pipelineRun.findFirst({
    where: {
      workspaceId,
      articleId
    },
    include: {
      steps: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return run ? mapRun(run) : null;
}

export async function getPipelineRunById(
  prisma: DbClient,
  workspaceId: string,
  pipelineRunId: string
) {
  const run = await prisma.pipelineRun.findFirst({
    where: {
      id: pipelineRunId,
      workspaceId
    },
    include: {
      steps: true
    }
  });

  return run ? mapRun(run) : null;
}

export async function getPipelineStepRunById(
  prisma: DbClient,
  workspaceId: string,
  pipelineStepRunId: string
) {
  return prisma.pipelineStepRun.findFirst({
    where: {
      id: pipelineStepRunId,
      workspaceId
    }
  });
}

export async function markPipelineStepQueued(
  prisma: DbClient,
  input: {
    workspaceId: string;
    pipelineStepRunId: string;
  }
) {
  return prisma.pipelineStepRun.updateMany({
    where: {
      id: input.pipelineStepRunId,
      workspaceId: input.workspaceId,
      status: {
        in: ["pending", "failed", "paused"]
      }
    },
    data: {
      status: "queued"
    }
  });
}

export async function markPipelineStepRunning(
  prisma: DbClient,
  input: {
    workspaceId: string;
    pipelineStepRunId: string;
    startedAt: Date;
  }
) {
  return prisma.pipelineStepRun.updateMany({
    where: {
      id: input.pipelineStepRunId,
      workspaceId: input.workspaceId,
      status: {
        in: ["queued", "running", "failed"]
      }
    },
    data: {
      status: "running",
      attempts: {
        increment: 1
      },
      startedAt: input.startedAt
    }
  });
}

export async function markPipelineStepSucceeded(
  prisma: DbClient,
  input: {
    workspaceId: string;
    pipelineStepRunId: string;
    outputJson?: Prisma.InputJsonValue | null;
    finishedAt: Date;
  }
) {
  return prisma.pipelineStepRun.updateMany({
    where: {
      id: input.pipelineStepRunId,
      workspaceId: input.workspaceId,
      status: {
        in: ["running", "succeeded"]
      }
    },
    data: {
      status: "succeeded",
      outputJson: input.outputJson ?? undefined,
      finishedAt: input.finishedAt
    }
  });
}

export async function markPipelineStepFailed(
  prisma: DbClient,
  input: {
    workspaceId: string;
    pipelineStepRunId: string;
    errorCode?: string | null;
    errorMessage?: string | null;
    finishedAt: Date;
  }
) {
  return prisma.pipelineStepRun.updateMany({
    where: {
      id: input.pipelineStepRunId,
      workspaceId: input.workspaceId,
      status: {
        in: ["queued", "running", "failed"]
      }
    },
    data: {
      status: "failed",
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage ?? null,
      finishedAt: input.finishedAt
    }
  });
}

export async function markPipelineRunSucceeded(
  prisma: DbClient,
  input: {
    workspaceId: string;
    pipelineRunId: string;
    currentStepKey: string | null;
    finishedAt: Date;
  }
) {
  return prisma.pipelineRun.updateMany({
    where: {
      id: input.pipelineRunId,
      workspaceId: input.workspaceId,
      status: "running"
    },
    data: {
      status: "succeeded",
      currentStepKey: input.currentStepKey,
      finishedAt: input.finishedAt
    }
  });
}

export async function markPipelineRunFailed(
  prisma: DbClient,
  input: {
    workspaceId: string;
    pipelineRunId: string;
    errorCode?: string | null;
    errorMessage?: string | null;
    finishedAt: Date;
  }
) {
  return prisma.pipelineRun.updateMany({
    where: {
      id: input.pipelineRunId,
      workspaceId: input.workspaceId,
      status: {
        in: ["running", "pending"]
      }
    },
    data: {
      status: "failed",
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage ?? null,
      finishedAt: input.finishedAt
    }
  });
}

export async function markPipelineRunRunning(
  prisma: DbClient,
  input: {
    workspaceId: string;
    pipelineRunId: string;
    currentStepKey: string | null;
  }
) {
  return prisma.pipelineRun.updateMany({
    where: {
      id: input.pipelineRunId,
      workspaceId: input.workspaceId
    },
    data: {
      status: "running",
      currentStepKey: input.currentStepKey
    }
  });
}

export function toPipelineRunResponse(run: PipelineRunRow | null) {
  return run ? mapRun(run) : null;
}
