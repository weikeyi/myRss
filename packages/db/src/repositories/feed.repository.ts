import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface UpsertFeedInput {
  workspaceId: string;
  title: string;
  url: string;
  siteUrl?: string | null;
  enabled?: boolean;
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export async function listFeeds(prisma: DbClient, workspaceId: string) {
  return prisma.feed.findMany({
    where: {
      workspaceId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getFeedByUrl(
  prisma: DbClient,
  workspaceId: string,
  url: string
) {
  return prisma.feed.findFirst({
    where: {
      workspaceId,
      url
    }
  });
}

export async function upsertFeed(prisma: DbClient, input: UpsertFeedInput) {
  const existing = await getFeedByUrl(prisma, input.workspaceId, input.url);

  if (existing) {
    return prisma.feed.update({
      where: {
        id: existing.id
      },
      data: {
        title: input.title,
        siteUrl: input.siteUrl ?? null,
        enabled: input.enabled ?? existing.enabled
      }
    });
  }

  return prisma.feed.create({
    data: {
      id: createId("feed"),
      workspaceId: input.workspaceId,
      title: input.title,
      url: input.url,
      siteUrl: input.siteUrl ?? null,
      enabled: input.enabled ?? true
    }
  });
}
