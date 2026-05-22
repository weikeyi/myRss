export const pipelineRunStatuses = [
  "pending",
  "running",
  "succeeded",
  "partial_failed",
  "failed",
  "canceled",
  "filtered",
  "paused"
] as const;

export type PipelineRunStatus = (typeof pipelineRunStatuses)[number];

export const pipelineStepStatuses = [
  "pending",
  "queued",
  "running",
  "succeeded",
  "failed",
  "skipped",
  "canceled",
  "paused"
] as const;

export type PipelineStepStatus = (typeof pipelineStepStatuses)[number];

export const jobStatuses = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "dead",
  "canceled",
  "paused"
] as const;

export type JobStatus = (typeof jobStatuses)[number];

export const jobTypes = ["pipeline.step"] as const;

export type JobType = (typeof jobTypes)[number];

export const workflowStepTypes = ["NO_OP", "FETCH_FULLTEXT"] as const;

export type WorkflowStepType = (typeof workflowStepTypes)[number];
