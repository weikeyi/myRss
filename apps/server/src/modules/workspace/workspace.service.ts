import { Inject, Injectable } from "@nestjs/common";
import type { OnModuleInit } from "@nestjs/common";

import {
  DEFAULT_WORKSPACE_SLUG,
  ensureDefaultWorkspace
} from "@myrss/db";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WorkspaceService implements OnModuleInit {
  private defaultWorkspaceId: string | null = null;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const workspace = await ensureDefaultWorkspace(this.prisma);
    this.defaultWorkspaceId = workspace.id;
  }

  async getDefaultWorkspaceId() {
    if (this.defaultWorkspaceId) {
      return this.defaultWorkspaceId;
    }

    const workspace = await ensureDefaultWorkspace(this.prisma);
    this.defaultWorkspaceId = workspace.id;
    return workspace.id;
  }

  getDefaultWorkspaceSlug() {
    return DEFAULT_WORKSPACE_SLUG;
  }
}
