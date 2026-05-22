import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { OnModuleInit } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import {
  buildDefaultWorkflowDefinition,
  buildNoopWorkflowDefinition,
  DEFAULT_PIPELINE_TRIGGER
} from "@myrss/core";
import type { PipelineJobPayload } from "@myrss/core";
import {
  createPipelineRun,
  createPipelineStepRun,
  ensureDefaultWorkflowConfig,
  getArticleDetail,
  getArticleDetailByWorkspace,
  getLatestPipelineRunForArticle,
  getPipelineRunById,
  getPipelineStepRunById,
  markPipelineRunFailed,
  markPipelineRunSucceeded,
  markPipelineStepFailed,
  markPipelineStepRunning,
  markPipelineStepSucceeded,
  markPipelineStepQueued
} from "@myrss/db";
import type { PipelineRun, WorkflowDefinition } from "@myrss/shared";

import { JobsService } from "../jobs/jobs.service";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspaceService } from "../workspace/workspace.service";
import { FetchFulltextStep } from "./steps/fetch-fulltext.step";

@Injectable()
export class PipelineService implements OnModuleInit {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
    @Inject(JobsService) private readonly jobsService: JobsService,
    @Inject(FetchFulltextStep) private readonly fetchFulltextStep: FetchFulltextStep
  ) {}

  async onModuleInit() {
    const workspaceId = await this.workspaceService.getDefaultWorkspaceId();
    await ensureDefaultWorkflowConfig(this.prisma, {
      workspaceId,
      definitionJson: buildDefaultWorkflowDefinition() as Prisma.InputJsonValue
    });
  }

  async getLatestPipeline(articleId: string): Promise<PipelineRun | null> {
    const workspaceId = await this.workspaceService.getDefaultWorkspaceId();
    return getLatestPipelineRunForArticle(this.prisma, workspaceId, articleId);
  }

  async startNoopPipeline(articleId: string): Promise<PipelineRun> {
    return this.startPipeline(articleId, buildNoopWorkflowDefinition(), "manual_test");
  }

  async startArticlePipeline(articleId: string): Promise<PipelineRun> {
    return this.startPipeline(
      articleId,
      buildDefaultWorkflowDefinition(),
      DEFAULT_PIPELINE_TRIGGER
    );
  }

  private async startPipeline(
    articleId: string,
    workflowDefinition: WorkflowDefinition,
    trigger: string
  ): Promise<PipelineRun> {
    const article = await getArticleDetail(this.prisma, articleId);

    if (!article) {
      throw new NotFoundException("Article not found");
    }

    const workspaceId = await this.workspaceService.getDefaultWorkspaceId();
    const workflowConfig = await ensureDefaultWorkflowConfig(this.prisma, {
      workspaceId,
      definitionJson: workflowDefinition as Prisma.InputJsonValue
    });
    const firstStep = workflowDefinition.steps[0];

    if (!firstStep) {
      throw new BadRequestException("Workflow has no steps");
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const pipelineRun = await createPipelineRun(tx, {
        workspaceId,
        articleId,
        workflowConfigId: workflowConfig.id,
        workflowVersion: workflowConfig.version,
        workflowSnapshotJson: workflowDefinition as Prisma.InputJsonValue,
        trigger,
        currentStepKey: firstStep.key,
        startedAt: now
      });

      for (const [stepIndex, stepDefinition] of workflowDefinition.steps.entries()) {
        await createPipelineStepRun(tx, {
          workspaceId,
          articleId,
          pipelineRunId: pipelineRun.id,
          stepKey: stepDefinition.key,
          stepType: stepDefinition.type,
          stepIndex,
          status: stepIndex === 0 ? "queued" : "pending",
          required: stepDefinition.required,
          maxAttempts: stepDefinition.retry.maxAttempts,
          inputJson: {
            pipelineRunId: pipelineRun.id,
            articleId,
            stepKey: stepDefinition.key,
            stepType: stepDefinition.type
          }
        });
      }

      await tx.article.updateMany({
        where: {
          id: articleId,
          workspaceId
        },
        data: {
          status: "processing"
        }
      });

      const firstStepRun = await tx.pipelineStepRun.findUnique({
        where: {
          pipelineRunId_stepKey: {
            pipelineRunId: pipelineRun.id,
            stepKey: firstStep.key
          }
        }
      });

      if (!firstStepRun) {
        throw new BadRequestException("Failed to create pipeline step");
      }

      await this.jobsService.enqueuePipelineStepJob({
        workspaceId,
        articleId,
        pipelineRunId: pipelineRun.id,
        pipelineStepRunId: firstStepRun.id,
        stepKey: firstStep.key,
        stepType: firstStep.type,
        trigger
      }, tx);

      const run = await getPipelineRunById(tx, workspaceId, pipelineRun.id);

      if (!run) {
        throw new BadRequestException("Failed to load pipeline run");
      }

      return run;
    });
  }

  async runPipelineJob(job: PipelineJobPayload) {
    const stepRun = await getPipelineStepRunById(
      this.prisma,
      job.workspaceId,
      job.pipelineStepRunId
    );

    if (!stepRun) {
      throw new BadRequestException("Pipeline step not found");
    }

    const now = new Date();

    if (stepRun.stepKey !== job.stepKey || stepRun.stepType !== job.stepType) {
      throw new BadRequestException("Pipeline job payload does not match step");
    }

    if (stepRun.status !== "succeeded") {
      const runningResult = await markPipelineStepRunning(this.prisma, {
        workspaceId: job.workspaceId,
        pipelineStepRunId: stepRun.id,
        startedAt: now
      });

      if (runningResult.count !== 1) {
        throw new BadRequestException("Pipeline step is not queued");
      }

      const output = await this.executePipelineStep(job);

      await markPipelineStepSucceeded(this.prisma, {
        workspaceId: job.workspaceId,
        pipelineStepRunId: stepRun.id,
        outputJson: output as Prisma.InputJsonValue,
        finishedAt: new Date()
      });
    }

    const pipelineRun = await getPipelineRunById(
      this.prisma,
      job.workspaceId,
      job.pipelineRunId
    );

    if (!pipelineRun) {
      throw new BadRequestException("Pipeline run not found");
    }

    const currentIndex = pipelineRun.steps.findIndex(
      (step) => step.id === stepRun.id
    );

    const nextStep = pipelineRun.steps[currentIndex + 1];

    if (nextStep) {
      await markPipelineStepQueued(this.prisma, {
        workspaceId: job.workspaceId,
        pipelineStepRunId: nextStep.id
      });

      await this.prisma.pipelineRun.updateMany({
        where: {
          id: pipelineRun.id,
          workspaceId: job.workspaceId
        },
        data: {
          currentStepKey: nextStep.stepKey
        }
      });

      await this.jobsService.enqueuePipelineStepJob({
        workspaceId: job.workspaceId,
        articleId: job.articleId,
        pipelineRunId: job.pipelineRunId,
        pipelineStepRunId: nextStep.id,
        stepKey: nextStep.stepKey,
        stepType: nextStep.stepType,
        trigger: job.trigger
      });

      return;
    }

    await markPipelineRunSucceeded(this.prisma, {
      workspaceId: job.workspaceId,
      pipelineRunId: job.pipelineRunId,
      currentStepKey: null,
      finishedAt: new Date()
    });

    await this.prisma.article.updateMany({
      where: {
        id: job.articleId,
        workspaceId: job.workspaceId
      },
      data: {
        status: "ready"
      }
    });
  }

  async failPipelineJob(
    job: PipelineJobPayload,
    errorCode: string,
    errorMessage: string
  ) {
    const stepRun = await getPipelineStepRunById(
      this.prisma,
      job.workspaceId,
      job.pipelineStepRunId
    );

    if (!stepRun) {
      return;
    }

    await markPipelineStepFailed(this.prisma, {
      workspaceId: job.workspaceId,
      pipelineStepRunId: stepRun.id,
      errorCode,
      errorMessage,
      finishedAt: new Date()
    });

    await markPipelineRunFailed(this.prisma, {
      workspaceId: job.workspaceId,
      pipelineRunId: job.pipelineRunId,
      errorCode,
      errorMessage,
      finishedAt: new Date()
    });

    await this.prisma.article.updateMany({
      where: {
        id: job.articleId,
        workspaceId: job.workspaceId
      },
      data: {
        status: "failed"
      }
    });
  }

  private async executePipelineStep(job: PipelineJobPayload) {
    if (job.stepType === "NO_OP") {
      return {
        message: "No-op step completed"
      };
    }

    if (job.stepType === "FETCH_FULLTEXT") {
      const article = await getArticleDetailByWorkspace(
        this.prisma,
        job.workspaceId,
        job.articleId
      );

      if (!article) {
        throw new BadRequestException("Article not found");
      }

      return this.fetchFulltextStep.execute({
        workspaceId: job.workspaceId,
        articleId: job.articleId
      });
    }

    throw new BadRequestException(`Unsupported pipeline step: ${job.stepType}`);
  }
}
