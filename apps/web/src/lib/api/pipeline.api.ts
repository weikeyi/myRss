import {
  PipelineRunResponseSchema,
  StartPipelineResponseSchema,
  type PipelineRun
} from "@myrss/shared";

import { apiRequest } from "./http";

export async function getArticlePipeline(
  articleId: string
): Promise<PipelineRun | null> {
  const payload = await apiRequest(
    `/api/v1/articles/${encodeURIComponent(articleId)}/pipeline`
  );
  return PipelineRunResponseSchema.parse(payload).data;
}

export async function startArticlePipeline(
  articleId: string
): Promise<PipelineRun> {
  const payload = await apiRequest(
    `/api/v1/articles/${encodeURIComponent(articleId)}/pipeline`,
    {
      method: "POST"
    }
  );
  return StartPipelineResponseSchema.parse(payload).data;
}
