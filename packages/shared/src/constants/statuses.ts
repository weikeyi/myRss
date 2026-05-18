export const articleStatuses = [
  "new",
  "queued",
  "processing",
  "ready",
  "partial_failed",
  "failed",
  "filtered",
  "archived",
  "paused"
] as const;

export type ArticleStatus = (typeof articleStatuses)[number];

export const readStates = ["unread", "reading", "read"] as const;

export type ReadState = (typeof readStates)[number];
