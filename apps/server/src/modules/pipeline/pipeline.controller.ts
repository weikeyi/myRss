import { Controller, Get, Inject, Param, Post } from "@nestjs/common";

import type {
  PipelineRunResponse,
  StartPipelineResponse
} from "@myrss/shared";

import { PipelineService } from "./pipeline.service";

@Controller("articles/:articleId/pipeline")
export class PipelineController {
  constructor(
    @Inject(PipelineService) private readonly pipelineService: PipelineService
  ) {}

  @Get()
  async getLatest(@Param("articleId") articleId: string): Promise<PipelineRunResponse> {
    return {
      data: await this.pipelineService.getLatestPipeline(articleId)
    };
  }

  @Post()
  async start(@Param("articleId") articleId: string): Promise<StartPipelineResponse> {
    return {
      data: await this.pipelineService.startArticlePipeline(articleId)
    };
  }
}
