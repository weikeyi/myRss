import { Inject, Injectable } from "@nestjs/common";
import type { OnApplicationShutdown } from "@nestjs/common";

import type { PipelineJobPayload } from "@myrss/core";
import { computeBackoffMs } from "@myrss/core";
import { JobLockLostError, isPipelineJobPayload } from "@myrss/db";

import { JobsService } from "../jobs/jobs.service";
import { PipelineService } from "../pipeline/pipeline.service";

@Injectable()
export class WorkerService implements OnApplicationShutdown {
  private readonly workerId = `worker-${process.pid}`;
  private running = false;
  private loopPromise: Promise<void> | null = null;

  constructor(
    @Inject(JobsService) private readonly jobsService: JobsService,
    @Inject(PipelineService) private readonly pipelineService: PipelineService
  ) {}

  async start() {
    if (this.loopPromise) {
      return;
    }

    this.running = true;
    this.loopPromise = this.loop();
  }

  async stop() {
    this.running = false;

    if (this.loopPromise) {
      await this.loopPromise;
      this.loopPromise = null;
    }
  }

  async onApplicationShutdown() {
    await this.stop();
  }

  private async loop() {
    while (this.running) {
      try {
        await this.jobsService.recoverStaleRunningJobs(
          new Date(Date.now() - 15 * 60 * 1000)
        );

        const job = await this.jobsService.claimNextPipelineJob(
          this.workerId,
          new Date(),
          new Date(Date.now() - 15 * 60 * 1000)
        );

        if (!job) {
          await this.sleep(1000);
          continue;
        }

        await this.execute(job);
      } catch (error) {
        console.error("[worker] loop error", error);
        await this.sleep(2000);
      }
    }
  }

  private async execute(job: {
    id: string;
    lockVersion: number;
    attempts: number;
    maxAttempts: number;
    payloadJson: unknown;
  }) {
    const heartbeat = this.startHeartbeat(job.id, job.lockVersion);

    try {
      if (!isPipelineJobPayload(job.payloadJson as never)) {
        throw new Error("Invalid pipeline job payload");
      }

      const payload = job.payloadJson as PipelineJobPayload;
      await this.pipelineService.runPipelineJob(payload);
      await this.jobsService.markJobSucceeded(
        job.id,
        this.workerId,
        job.lockVersion,
        new Date()
      );
    } catch (error) {
      if (error instanceof JobLockLostError) {
        return;
      }

      const payload = isPipelineJobPayload(job.payloadJson as never)
        ? (job.payloadJson as PipelineJobPayload)
        : null;
      const message = error instanceof Error ? error.message : "Unknown error";
      const code = error instanceof Error ? error.name : "WORKER_ERROR";

      if (payload) {
        await this.pipelineService.failPipelineJob(payload, code, message);
      }

      if (job.attempts < job.maxAttempts) {
        const delayMs = computeBackoffMs(
          {
            maxAttempts: job.maxAttempts,
            baseDelayMs: 2000,
            maxDelayMs: 30000
          },
          job.attempts
        );

        await this.jobsService.markJobPendingForRetry(
          job.id,
          this.workerId,
          job.lockVersion,
          new Date(Date.now() + delayMs),
          code,
          message
        );
        return;
      }

      await this.jobsService.markJobDead(
        job.id,
        this.workerId,
        job.lockVersion,
        new Date(),
        code,
        message
      );
    } finally {
      clearInterval(heartbeat);
    }
  }

  private startHeartbeat(jobId: string, lockVersion: number): NodeJS.Timeout {
    return setInterval(() => {
      void this.jobsService.heartbeatJob(
        jobId,
        this.workerId,
        lockVersion,
        new Date()
      );
    }, 30000);
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
