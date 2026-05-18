import { PrismaClient } from "@prisma/client";

process.env.DATABASE_URL ??= "file:../../data/myrss.db";

const prisma = new PrismaClient();

const workspaceId = "workspace_default";
const feedId = "feed_sample";

const articles = [
  {
    id: "article_event_loop",
    title: "Understanding the Event Loop",
    originalUrl: "https://example.com/articles/event-loop",
    canonicalUrl: "https://example.com/articles/event-loop",
    author: "Ada Chen",
    summary: "A short tour of the JavaScript event loop and task queues.",
    status: "ready",
    readState: "unread",
    favorite: false,
    language: "en",
    publishedAt: new Date("2026-05-14T10:00:00.000Z"),
    importedAt: new Date("2026-05-14T12:00:00.000Z"),
    content: {
      id: "content_event_loop",
      markdownContent: "# Understanding the Event Loop\n\nThe event loop keeps JavaScript responsive...",
      textContent: "The event loop keeps JavaScript responsive by scheduling work in turns.",
      wordCount: 420,
      fetchedAt: new Date("2026-05-14T12:10:00.000Z")
    },
    source: {
      id: "source_event_loop",
      sourceType: "rss",
      feedTitle: "Sample Feed",
      originalUrl: "https://example.com/articles/event-loop",
      importedAt: new Date("2026-05-14T12:00:00.000Z")
    }
  },
  {
    id: "article_prisma_sqlite",
    title: "Prisma and SQLite for a Small Product",
    originalUrl: "https://example.com/articles/prisma-sqlite",
    canonicalUrl: "https://example.com/articles/prisma-sqlite",
    author: "Mina Liu",
    summary: "Why Prisma and SQLite are a practical starting point for a monorepo shell.",
    status: "ready",
    readState: "reading",
    favorite: true,
    language: "en",
    publishedAt: new Date("2026-05-15T08:30:00.000Z"),
    importedAt: new Date("2026-05-15T09:00:00.000Z"),
    content: {
      id: "content_prisma_sqlite",
      markdownContent: "# Prisma and SQLite\n\nThis setup keeps local development simple...",
      textContent: "This setup keeps local development simple and makes the first slice easy to inspect.",
      wordCount: 360,
      fetchedAt: new Date("2026-05-15T09:10:00.000Z")
    },
    source: {
      id: "source_prisma_sqlite",
      sourceType: "rss",
      feedTitle: "Sample Feed",
      originalUrl: "https://example.com/articles/prisma-sqlite",
      importedAt: new Date("2026-05-15T09:00:00.000Z")
    }
  },
  {
    id: "article_view_model",
    title: "Thinking in View Models",
    originalUrl: "https://example.com/articles/view-models",
    canonicalUrl: "https://example.com/articles/view-models",
    author: null,
    summary: "A note on keeping UI state and server state separate.",
    status: "ready",
    readState: "read",
    favorite: false,
    language: "zh-CN",
    publishedAt: new Date("2026-05-16T14:20:00.000Z"),
    importedAt: new Date("2026-05-16T15:00:00.000Z"),
    content: {
      id: "content_view_model",
      markdownContent: "# Thinking in View Models\n\nThe UI should shape the data it needs...",
      textContent: "The UI should shape the data it needs instead of exposing every backend field.",
      wordCount: 280,
      fetchedAt: new Date("2026-05-16T15:15:00.000Z")
    },
    source: {
      id: "source_view_model",
      sourceType: "rss",
      feedTitle: "Sample Feed",
      originalUrl: "https://example.com/articles/view-models",
      importedAt: new Date("2026-05-16T15:00:00.000Z")
    }
  }
];

async function main() {
  await prisma.workspace.upsert({
    where: {
      slug: "default"
    },
    update: {
      name: "MyRSS"
    },
    create: {
      id: workspaceId,
      slug: "default",
      name: "MyRSS"
    }
  });

  await prisma.feed.upsert({
    where: {
      id: feedId
    },
    update: {
      workspaceId,
      title: "Sample Feed",
      url: "https://example.com/feed.xml",
      siteUrl: "https://example.com"
    },
    create: {
      id: feedId,
      workspaceId,
      title: "Sample Feed",
      url: "https://example.com/feed.xml",
      siteUrl: "https://example.com"
    }
  });

  for (const article of articles) {
    await prisma.article.upsert({
      where: {
        id: article.id
      },
      update: {
        workspaceId,
        feedId,
        title: article.title,
        originalUrl: article.originalUrl,
        canonicalUrl: article.canonicalUrl,
        author: article.author,
        summary: article.summary,
        status: article.status,
        readState: article.readState,
        favorite: article.favorite,
        language: article.language,
        publishedAt: article.publishedAt,
        importedAt: article.importedAt
      },
      create: {
        id: article.id,
        workspaceId,
        feedId,
        title: article.title,
        originalUrl: article.originalUrl,
        canonicalUrl: article.canonicalUrl,
        author: article.author,
        summary: article.summary,
        status: article.status,
        readState: article.readState,
        favorite: article.favorite,
        language: article.language,
        publishedAt: article.publishedAt,
        importedAt: article.importedAt
      }
    });

    await prisma.articleContent.upsert({
      where: {
        articleId: article.id
      },
      update: {
        workspaceId,
        markdownContent: article.content.markdownContent,
        textContent: article.content.textContent,
        wordCount: article.content.wordCount,
        fetchedAt: article.content.fetchedAt
      },
      create: {
        id: article.content.id,
        workspaceId,
        articleId: article.id,
        markdownContent: article.content.markdownContent,
        textContent: article.content.textContent,
        wordCount: article.content.wordCount,
        fetchedAt: article.content.fetchedAt
      }
    });

    await prisma.articleSource.upsert({
      where: {
        id: article.source.id
      },
      update: {
        workspaceId,
        articleId: article.id,
        feedId,
        sourceType: article.source.sourceType,
        feedTitle: article.source.feedTitle,
        originalUrl: article.source.originalUrl,
        importedAt: article.source.importedAt
      },
      create: {
        id: article.source.id,
        workspaceId,
        articleId: article.id,
        feedId,
        sourceType: article.source.sourceType,
        feedTitle: article.source.feedTitle,
        originalUrl: article.source.originalUrl,
        importedAt: article.source.importedAt
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeded default workspace, feed, and 3 articles.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
