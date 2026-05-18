import type { PrismaClient } from "@prisma/client";

import { DEFAULT_WORKSPACE_NAME, DEFAULT_WORKSPACE_SLUG } from "../constants";

export async function ensureDefaultWorkspace(prisma: PrismaClient) {
  return prisma.workspace.upsert({
    where: {
      slug: DEFAULT_WORKSPACE_SLUG
    },
    update: {
      name: DEFAULT_WORKSPACE_NAME
    },
    create: {
      id: "workspace_default",
      slug: DEFAULT_WORKSPACE_SLUG,
      name: DEFAULT_WORKSPACE_NAME
    }
  });
}

export async function getDefaultWorkspace(prisma: PrismaClient) {
  return prisma.workspace.findUnique({
    where: {
      slug: DEFAULT_WORKSPACE_SLUG
    }
  });
}
