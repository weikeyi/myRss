import {
  pipelineRunStatuses,
  pipelineStepStatuses,
  workflowStepTypes,
  type WorkflowDefinition,
  type WorkflowStepDefinition
} from "@myrss/shared";

export const DEFAULT_PIPELINE_VERSION = 1;
export const DEFAULT_PIPELINE_TRIGGER = "manual_url";

export function buildDefaultWorkflowDefinition(): WorkflowDefinition {
  return {
    version: DEFAULT_PIPELINE_VERSION,
    mode: "linear",
    steps: [
      {
        key: "fetch_fulltext",
        type: "FETCH_FULLTEXT",
        enabled: true,
        required: true,
        timeoutMs: 30000,
        retry: {
          maxAttempts: 3,
          baseDelayMs: 2000,
          maxDelayMs: 30000
        },
        params: {}
      }
    ]
  };
}

export function buildNoopWorkflowDefinition(): WorkflowDefinition {
  return {
    version: DEFAULT_PIPELINE_VERSION,
    mode: "linear",
    steps: [
      {
        key: "noop",
        type: "NO_OP",
        enabled: true,
        required: true,
        timeoutMs: 5000,
        retry: {
          maxAttempts: 1,
          baseDelayMs: 0,
          maxDelayMs: 0
        },
        params: {}
      }
    ]
  };
}

export function getFirstEnabledStep(
  definition: WorkflowDefinition
): WorkflowStepDefinition | null {
  return definition.steps.find((step) => step.enabled) ?? null;
}

export function isTerminalPipelineStatus(status: string) {
  return (
    pipelineRunStatuses.includes(status as (typeof pipelineRunStatuses)[number]) &&
    !["pending", "running"].includes(status)
  );
}

export function isTerminalStepStatus(status: string) {
  return (
    pipelineStepStatuses.includes(status as (typeof pipelineStepStatuses)[number]) &&
    ["succeeded", "failed", "skipped", "canceled", "paused"].includes(status)
  );
}

export function isNoOpStepType(stepType: string) {
  return workflowStepTypes.includes(
    stepType as (typeof workflowStepTypes)[number]
  );
}
