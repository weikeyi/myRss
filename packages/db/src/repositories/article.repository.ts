import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  ArticleDetail,
  ArticleListItem,
  ArticleListQuery,
  ArticleListResponse,
  ReadState
} from "@myrss/shared";

import { DEFAULT_WORKSPACE_SLUG } from "../constants";

type DbClient = PrismaClient | Prisma.TransactionClient;

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

export interface CreateManualArticleInput {
  workspaceId: string;
  originalUrl: string;
  canonicalUrl: string;
  canonicalUrlHash: string;
}

export interface ArticleFetchTarget {
  id: string;
  title: string;
  originalUrl: string;
  canonicalUrl: string;
}

export interface SaveArticleFulltextInput {
  workspaceId: string;
  articleId: string;
  title?: string | null;
  author?: string | null;
  summary?: string | null;
  markdownContent?: string | null;
  textContent?: string | null;
  wordCount?: number | null;
  fetchedAt: Date;
}

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

async function getDefaultWorkspaceId(prisma: DbClient) {
  const workspace = await prisma.workspace.findUnique({
    where: {
      slug: DEFAULT_WORKSPACE_SLUG
    },
    select: {
      id: true
    }
  });

  return workspace?.id ?? null;
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
  prisma: DbClient,
  query: ArticleListQuery
): Promise<ArticleListResponse> {
  const workspaceId = await getDefaultWorkspaceId(prisma);

  if (!workspaceId) {
    return {
      data: [],
      meta: {
        nextCursor: null
      }
    };
  }

  const where: Prisma.ArticleWhereInput = {
    workspaceId
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
    ...(query.cursor
      ? {
          cursor: {
            id: query.cursor
          },
          skip: 1
        }
      : {}),
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
  prisma: DbClient,
  articleId: string
): Promise<ArticleDetail | null> {
  const workspaceId = await getDefaultWorkspaceId(prisma);

  if (!workspaceId) {
    return null;
  }

  return getArticleDetailByWorkspace(prisma, workspaceId, articleId);
}

export async function getArticleDetailByWorkspace(
  prisma: DbClient,
  workspaceId: string,
  articleId: string
): Promise<ArticleDetail | null> {
  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
      workspaceId
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

export async function updateArticleReadState(
  prisma: DbClient,
  workspaceId: string,
  articleId: string,
  readState: ReadState
): Promise<ArticleDetail | null> {
  const updated = await prisma.article.updateMany({
    where: {
      id: articleId,
      workspaceId
    },
    data: {
      readState
    }
  });

  if (updated.count !== 1) {
    return null;
  }

  return getArticleDetailByWorkspace(prisma, workspaceId, articleId);
}

export async function updateArticleFavorite(
  prisma: DbClient,
  workspaceId: string,
  articleId: string,
  favorite: boolean
): Promise<ArticleDetail | null> {
  const updated = await prisma.article.updateMany({
    where: {
      id: articleId,
      workspaceId
    },
    data: {
      favorite
    }
  });

  if (updated.count !== 1) {
    return null;
  }

  return getArticleDetailByWorkspace(prisma, workspaceId, articleId);
}

export async function createManualArticle(
  prisma: DbClient,
  input: CreateManualArticleInput
): Promise<ArticleDetail> {
  const existing = await prisma.article.findFirst({
    where: {
      workspaceId: input.workspaceId,
      canonicalUrlHash: input.canonicalUrlHash
    },
    select: {
      id: true
    }
  });

  if (existing) {
    const article = await getArticleDetailByWorkspace(
      prisma,
      input.workspaceId,
      existing.id
    );

    if (article) {
      return article;
    }
  }

  const now = new Date();
  const articleId = createId("article");

  await prisma.article.create({
    data: {
      id: articleId,
      workspaceId: input.workspaceId,
      title: input.canonicalUrl,
      originalUrl: input.originalUrl,
      canonicalUrl: input.canonicalUrl,
      canonicalUrlHash: input.canonicalUrlHash,
      status: "queued",
      importedAt: now,
      sources: {
        create: {
          id: createId("source"),
          workspaceId: input.workspaceId,
          sourceType: "manual_url",
          originalUrl: input.originalUrl,
          importedAt: now
        }
      }
    }
  });

  const article = await getArticleDetailByWorkspace(prisma, input.workspaceId, articleId);

  if (!article) {
    throw new Error("Failed to create manual article");
  }

  return article;
}

export async function getArticleFetchTarget(
  prisma: DbClient,
  workspaceId: string,
  articleId: string
): Promise<ArticleFetchTarget | null> {
  return prisma.article.findFirst({
    where: {
      id: articleId,
      workspaceId
    },
    select: {
      id: true,
      title: true,
      originalUrl: true,
      canonicalUrl: true
    }
  });
}

export async function saveArticleFulltext(
  prisma: DbClient,
  input: SaveArticleFulltextInput
) {
  await prisma.articleContent.upsert({
    where: {
      articleId: input.articleId
    },
    update: {
      workspaceId: input.workspaceId,
      markdownContent: input.markdownContent ?? null,
      textContent: input.textContent ?? null,
      wordCount: input.wordCount ?? null,
      fetchedAt: input.fetchedAt
    },
    create: {
      id: createId("content"),
      workspaceId: input.workspaceId,
      articleId: input.articleId,
      markdownContent: input.markdownContent ?? null,
      textContent: input.textContent ?? null,
      wordCount: input.wordCount ?? null,
      fetchedAt: input.fetchedAt
    }
  });

  await prisma.article.updateMany({
    where: {
      id: input.articleId,
      workspaceId: input.workspaceId
    },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.author ? { author: input.author } : {}),
      ...(input.summary ? { summary: input.summary } : {})
    }
  });
}
