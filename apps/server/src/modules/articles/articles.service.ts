import { Inject, NotFoundException, Injectable } from "@nestjs/common";

import { getArticleDetail, listArticles } from "@myrss/db";
import type { ArticleListQuery } from "@myrss/shared";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ArticlesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
}
