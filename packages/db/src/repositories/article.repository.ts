import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  ArticleDetail,
  ArticleListItem,
  ArticleListQuery,
  ArticleListResponse
} from "@myrss/shared";

import { DEFAULT_WORKSPACE_SLUG } from "../constants";

type ArticleListRow = Prisma.ArticleGetPayload<{
  include: {
    feed: {
      select: {
        id: true;
        title: true;
      };
    };
    _count: {
      select: {
        sources: true;
      };
    };
  };
}>;

type ArticleDetailRow = Prisma.ArticleGetPayload<{
  include: {
    feed: {
      select: {
        id: true;
        title: true;
      };
    };
    sources: true;
    content: true;
  };
}>;

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function mapListItem(article: ArticleListRow): ArticleListItem {
  return {
    id: article.id,
    title: article.title,
    feed: article.feed
      ? {
          id: article.feed.id,
          title: article.feed.title
        }
      : null,
    status: article.status as ArticleListItem["status"],
    readState: article.readState as ArticleListItem["readState"],
    favorite: article.favorite,
    publishedAt: toIsoString(article.publishedAt),
    importedAt: article.importedAt.toISOString(),
    language: article.language,
    summaryPreview: article.summary,
    sourceCount: article._count.sources
  };
}

function mapDetailItem(article: ArticleDetailRow): ArticleDetail {
  return {
    id: article.id,
    title: article.title,
    feed: article.feed
      ? {
          id: article.feed.id,
          title: article.feed.title
        }
      : null,
    status: article.status as ArticleDetail["status"],
    readState: article.readState as ArticleDetail["readState"],
    favorite: article.favorite,
    publishedAt: toIsoString(article.publishedAt),
    importedAt: article.importedAt.toISOString(),
    language: article.language,
    summaryPreview: article.summary,
    sourceCount: article.sources.length,
    originalUrl: article.originalUrl,
    canonicalUrl: article.canonicalUrl,
    author: article.author,
    summary: article.summary,
    sources: article.sources.map((source) => ({
      id: source.id,
      sourceType: source.sourceType,
      feedId: source.feedId,
      feedTitle: source.feedTitle,
      originalUrl: source.originalUrl,
      importedAt: source.importedAt.toISOString()
    })),
    content: article.content
      ? {
          markdownContent: article.content.markdownContent,
          textContent: article.content.textContent,
          wordCount: article.content.wordCount,
          fetchedAt: toIsoString(article.content.fetchedAt)
        }
      : null
  };
}

export async function listArticles(
  prisma: PrismaClient,
  query: ArticleListQuery
): Promise<ArticleListResponse> {
  const workspace = await prisma.workspace.findUnique({
    where: {
      slug: DEFAULT_WORKSPACE_SLUG
    },
    select: {
      id: true
    }
  });

  if (!workspace) {
    return {
      data: [],
      meta: {
        nextCursor: null
      }
    };
  }

  const where: Prisma.ArticleWhereInput = {
    workspaceId: workspace.id
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.readState) {
    where.readState = query.readState;
  }

  if (query.feedId) {
    where.feedId = query.feedId;
  }

  if (query.q) {
    where.OR = [
      {
        title: {
          contains: query.q
        }
      },
      {
        summary: {
          contains: query.q
        }
      }
    ];
  }

  const rows = await prisma.article.findMany({
    where,
    orderBy: [
      {
        publishedAt: "desc"
      },
      {
        importedAt: "desc"
      }
    ],
    take: query.limit + 1,
    include: {
      feed: {
        select: {
          id: true,
          title: true
        }
      },
      _count: {
        select: {
          sources: true
        }
      }
    }
  });

  const hasMore = rows.length > query.limit;
  const pageItems = hasMore ? rows.slice(0, query.limit) : rows;

  return {
    data: pageItems.map(mapListItem),
    meta: {
      nextCursor: hasMore ? pageItems.at(-1)?.id ?? null : null
    }
  };
}

export async function getArticleDetail(
  prisma: PrismaClient,
  articleId: string
): Promise<ArticleDetail | null> {
  const workspace = await prisma.workspace.findUnique({
    where: {
      slug: DEFAULT_WORKSPACE_SLUG
    },
    select: {
      id: true
    }
  });

  if (!workspace) {
    return null;
  }

  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
      workspaceId: workspace.id
    },
    include: {
      feed: {
        select: {
          id: true,
          title: true
        }
      },
      sources: true,
      content: true
    }
  });

  return article ? mapDetailItem(article) : null;
}
