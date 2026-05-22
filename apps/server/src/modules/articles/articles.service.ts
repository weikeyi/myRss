import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { normalizeArticleUrl } from "@myrss/core";
import {
  createManualArticle,
  getArticleDetail,
  getArticleDetailByWorkspace,
  listArticles,
  updateArticleFavorite,
  updateArticleReadState
} from "@myrss/db";
import type {
  ArticleListQuery,
  CreateManualArticleInput,
  ReadState
} from "@myrss/shared";

import { PipelineService } from "../pipeline/pipeline.service";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspaceService } from "../workspace/workspace.service";

@Injectable()
export class ArticlesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
    @Inject(PipelineService) private readonly pipelineService: PipelineService
  ) {}

  async list(query: ArticleListQuery) {
    return listArticles(this.prisma, query);
  }

  async detail(articleId: string) {
    const article = await getArticleDetail(this.prisma, articleId);

    if (!article) {
      throw new NotFoundException("Article not found");
    }

    return article;
  }

  async updateReadState(articleId: string, readState: ReadState) {
    const workspaceId = await this.workspaceService.getDefaultWorkspaceId();
    const article = await updateArticleReadState(
      this.prisma,
      workspaceId,
      articleId,
      readState
    );

    if (!article) {
      throw new NotFoundException("Article not found");
    }

    return article;
  }

  async updateFavorite(articleId: string, favorite: boolean) {
    const workspaceId = await this.workspaceService.getDefaultWorkspaceId();
    const article = await updateArticleFavorite(
      this.prisma,
      workspaceId,
      articleId,
      favorite
    );

    if (!article) {
      throw new NotFoundException("Article not found");
    }

    return article;
  }

  async createManual(input: CreateManualArticleInput) {
    const workspaceId = await this.workspaceService.getDefaultWorkspaceId();
    const normalized = normalizeArticleUrl(input.url);
    const article = await createManualArticle(this.prisma, {
      workspaceId,
      originalUrl: normalized.originalUrl,
      canonicalUrl: normalized.canonicalUrl,
      canonicalUrlHash: normalized.canonicalUrlHash
    });

    if (article.status === "queued" || article.status === "failed") {
      await this.pipelineService.startArticlePipeline(article.id);
    }

    const latest = await getArticleDetailByWorkspace(
      this.prisma,
      workspaceId,
      article.id
    );

    if (!latest) {
      throw new NotFoundException("Article not found");
    }

    return latest;
  }
}
