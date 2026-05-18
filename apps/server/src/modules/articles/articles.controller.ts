import { BadRequestException, Controller, Get, Inject, Param, Query } from "@nestjs/common";

import type {
  ArticleDetailResponse,
  ArticleListQuery
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

  @Get(":articleId")
  async detail(@Param("articleId") articleId: string) {
    if (!articleId) {
      throw new BadRequestException("Article id is required");
    }

    const article = await this.articlesService.detail(articleId);
    return { data: article } as ArticleDetailResponse;
  }
}
