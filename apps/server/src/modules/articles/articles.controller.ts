import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";

import type {
  ArticleDetailResponse,
  ArticleListQuery
} from "@myrss/shared";
import {
  CreateManualArticleSchema,
  UpdateFavoriteSchema,
  UpdateReadStateSchema
} from "@myrss/shared";

import { ArticlesService } from "./articles.service";

@Controller("articles")
export class ArticlesController {
  constructor(
    @Inject(ArticlesService) private readonly articlesService: ArticlesService
  ) {}

  private parseListQuery(query: Record<string, unknown>): ArticleListQuery {
    const limitValue = query.limit;
    const limit =
      typeof limitValue === "number" || typeof limitValue === "string"
        ? Number(limitValue)
        : 30;

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException("Invalid article query");
    }

    const readString = (value: unknown) =>
      typeof value === "string" && value.length > 0 ? value : undefined;

    return {
      limit,
      status: readString(query.status) as ArticleListQuery["status"],
      readState: readString(query.readState) as ArticleListQuery["readState"],
      feedId: readString(query.feedId),
      q: readString(query.q),
      cursor: readString(query.cursor)
    };
  }

  @Get()
  async list(@Query() query: Record<string, unknown>) {
    return this.articlesService.list(this.parseListQuery(query));
  }

  @Post("manual")
  async createManual(
    @Body() body: unknown
  ): Promise<ArticleDetailResponse> {
    const parsed = CreateManualArticleSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException("Invalid manual article input");
    }

    return {
      data: await this.articlesService.createManual(parsed.data)
    };
  }

  @Get(":articleId")
  async detail(@Param("articleId") articleId: string) {
    if (!articleId) {
      throw new BadRequestException("Article id is required");
    }

    const article = await this.articlesService.detail(articleId);
    return { data: article } as ArticleDetailResponse;
  }

  @Patch(":articleId/read-state")
  async updateReadState(
    @Param("articleId") articleId: string,
    @Body() body: unknown
  ): Promise<ArticleDetailResponse> {
    const parsed = UpdateReadStateSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException("Invalid read state input");
    }

    return {
      data: await this.articlesService.updateReadState(
        articleId,
        parsed.data.readState
      )
    };
  }

  @Patch(":articleId/favorite")
  async updateFavorite(
    @Param("articleId") articleId: string,
    @Body() body: unknown
  ): Promise<ArticleDetailResponse> {
    const parsed = UpdateFavoriteSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException("Invalid favorite input");
    }

    return {
      data: await this.articlesService.updateFavorite(
        articleId,
        parsed.data.favorite
      )
    };
  }
}
