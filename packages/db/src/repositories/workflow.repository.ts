import type { PrismaClient, Prisma } from "@prisma/client";

import { DEFAULT_WORKFLOW_NAME } from "../constants";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function ensureDefaultWorkflowConfig(
  prisma: DbClient,
  input: {
    workspaceId: string;
    definitionJson: Prisma.InputJsonValue;
  }
) {
  return prisma.workflowConfig.upsert({
    where: {
      workspaceId_name: {
        workspaceId: input.workspaceId,
        name: DEFAULT_WORKFLOW_NAME
      }
    },
    update: {
      description: "Default article processing workflow",
      enabled: true,
      isDefault: true,
      definitionJson: input.definitionJson
    },
    create: {
      workspaceId: input.workspaceId,
      name: DEFAULT_WORKFLOW_NAME,
      description: "Default article processing workflow",
      enabled: true,
      isDefault: true,
      definitionJson: input.definitionJson
    }
  });
}

export async function getDefaultWorkflowConfig(
  prisma: DbClient,
  workspaceId: string
) {
  return prisma.workflowConfig.findFirst({
    where: {
      workspaceId,
      isDefault: true,
      enabled: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}
