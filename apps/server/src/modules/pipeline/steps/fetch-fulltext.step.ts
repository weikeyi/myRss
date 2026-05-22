import { Inject, Injectable } from "@nestjs/common";

import { getArticleFetchTarget, saveArticleFulltext } from "@myrss/db";
import { extractReadableArticle, safeFetchText } from "@myrss/fetching";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FetchFulltextStep {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async execute(input: { workspaceId: string; articleId: string }) {
    const article = await getArticleFetchTarget(
      this.prisma,
      input.workspaceId,
      input.articleId
    );

    if (!article) {
      throw new Error("Article not found for fulltext fetch");
    }

    const response = await safeFetchText(article.canonicalUrl);
    const extracted = extractReadableArticle(response.text, response.finalUrl);
    const fetchedAt = new Date();

    await saveArticleFulltext(this.prisma, {
      workspaceId: input.workspaceId,
      articleId: input.articleId,
      title: extracted.title,
      author: extracted.byline,
      summary: extracted.excerpt,
      markdownContent: extracted.markdownContent,
      textContent: extracted.textContent,
      wordCount: extracted.wordCount,
      fetchedAt
    });

    return {
      finalUrl: response.finalUrl,
      title: extracted.title,
      wordCount: extracted.wordCount,
      fetchedAt: fetchedAt.toISOString()
    };
  }
}
