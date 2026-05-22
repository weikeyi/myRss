import type {
  JobStatus,
  JobType,
  PipelineRunStatus,
  PipelineStepStatus,
  WorkflowDefinition,
  WorkflowStepDefinition,
  WorkflowStepType
} from "@myrss/shared";

export type {
  JobStatus,
  JobType,
  PipelineRunStatus,
  PipelineStepStatus,
  WorkflowDefinition,
  WorkflowStepDefinition,
  WorkflowStepType
};

export interface PipelineStepRunInput {
  articleId: string;
  pipelineRunId: string;
  pipelineStepRunId: string;
  stepKey: string;
  stepType: WorkflowStepType;
}

export interface PipelineJobPayload extends PipelineStepRunInput {
  workspaceId: string;
  trigger: string;
}

export interface NoopStepResult {
  readonly status: "succeeded";
}
