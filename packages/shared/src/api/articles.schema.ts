import { z } from "zod";
import { articleStatuses, readStates } from "../constants/statuses";

export const ArticleListQuerySchema = z.object({
  status: z.enum(articleStatuses).optional(),
  readState: z.enum(readStates).optional(),
  feedId: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30)
});

export const UpdateReadStateSchema = z.object({
  readState: z.enum(readStates)
});

export const UpdateFavoriteSchema = z.object({
  favorite: z.boolean()
});

export const CreateManualArticleSchema = z.object({
  url: z.string().url()
});

export const ArticleSourceSchema = z.object({
  id: z.string(),
  sourceType: z.string(),
  feedId: z.string().nullable(),
  feedTitle: z.string().nullable(),
  originalUrl: z.string(),
  importedAt: z.string()
});

export const ArticleListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  feed: z
    .object({
      id: z.string(),
      title: z.string().nullable()
    })
    .nullable(),
  status: z.enum(articleStatuses),
  readState: z.enum(readStates),
  favorite: z.boolean(),
  publishedAt: z.string().nullable(),
  importedAt: z.string(),
  language: z.string().nullable(),
  summaryPreview: z.string().nullable(),
  sourceCount: z.number().int().nonnegative()
});

export const ArticleDetailSchema = ArticleListItemSchema.extend({
  originalUrl: z.string(),
  canonicalUrl: z.string(),
  author: z.string().nullable(),
  summary: z.string().nullable(),
  sources: z.array(ArticleSourceSchema),
  content: z
    .object({
      markdownContent: z.string().nullable(),
      textContent: z.string().nullable(),
      wordCount: z.number().int().nullable(),
      fetchedAt: z.string().nullable()
    })
    .nullable()
});

export const ArticleListResponseSchema = z.object({
  data: z.array(ArticleListItemSchema),
  meta: z.object({
    nextCursor: z.string().nullable()
  })
});

export const ArticleDetailResponseSchema = z.object({
  data: ArticleDetailSchema
});

export type ArticleListQuery = z.infer<typeof ArticleListQuerySchema>;
export type UpdateReadStateInput = z.infer<typeof UpdateReadStateSchema>;
export type UpdateFavoriteInput = z.infer<typeof UpdateFavoriteSchema>;
export type CreateManualArticleInput = z.infer<typeof CreateManualArticleSchema>;
export type ArticleListItem = z.infer<typeof ArticleListItemSchema>;
export type ArticleDetail = z.infer<typeof ArticleDetailSchema>;
export type ArticleListResponse = z.infer<typeof ArticleListResponseSchema>;
export type ArticleDetailResponse = z.infer<typeof ArticleDetailResponseSchema>;
