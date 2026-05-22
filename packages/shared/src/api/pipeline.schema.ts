import { z } from "zod";

import {
  jobStatuses,
  jobTypes,
  pipelineRunStatuses,
  pipelineStepStatuses,
  workflowStepTypes
} from "../constants/workflow";

export const RetryPolicySchema = z.object({
  maxAttempts: z.number().int().positive(),
  baseDelayMs: z.number().int().nonnegative(),
  maxDelayMs: z.number().int().nonnegative()
});

export const WorkflowStepDefinitionSchema = z.object({
  key: z.string(),
  type: z.enum(workflowStepTypes),
  enabled: z.boolean(),
  required: z.boolean(),
  timeoutMs: z.number().int().positive(),
  retry: RetryPolicySchema,
  params: z.record(z.unknown())
});

export const WorkflowDefinitionSchema = z.object({
  version: z.number().int().positive(),
  mode: z.literal("linear"),
  steps: z.array(WorkflowStepDefinitionSchema)
});

export const PipelineStepRunSchema = z.object({
  id: z.string(),
  pipelineRunId: z.string(),
  stepKey: z.string(),
  stepType: z.enum(workflowStepTypes),
  stepIndex: z.number().int().nonnegative(),
  status: z.enum(pipelineStepStatuses),
  attempts: z.number().int().nonnegative(),
  maxAttempts: z.number().int().positive(),
  required: z.boolean(),
  inputJson: z.record(z.unknown()).nullable(),
  outputJson: z.record(z.unknown()).nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  skippedReason: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable()
});

export const PipelineRunSchema = z.object({
  id: z.string(),
  articleId: z.string(),
  workflowConfigId: z.string().nullable(),
  workflowVersion: z.number().int().positive(),
  status: z.enum(pipelineRunStatuses),
  trigger: z.string(),
  currentStepKey: z.string().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  steps: z.array(PipelineStepRunSchema)
});

export const PipelineRunResponseSchema = z.object({
  data: PipelineRunSchema.nullable()
});

export const StartPipelineResponseSchema = z.object({
  data: PipelineRunSchema
});

export const JobClaimResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    type: z.enum(jobTypes),
    status: z.enum(jobStatuses)
  })
});

export type RetryPolicy = z.infer<typeof RetryPolicySchema>;
export type WorkflowStepDefinition = z.infer<typeof WorkflowStepDefinitionSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
export type PipelineStepRun = z.infer<typeof PipelineStepRunSchema>;
export type PipelineRun = z.infer<typeof PipelineRunSchema>;
export type PipelineRunResponse = z.infer<typeof PipelineRunResponseSchema>;
export type StartPipelineResponse = z.infer<typeof StartPipelineResponseSchema>;
