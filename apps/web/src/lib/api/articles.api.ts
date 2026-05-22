import {
  ArticleDetailResponseSchema,
  ArticleListResponseSchema,
  type ArticleDetail,
  type ArticleListQuery,
  type ArticleListResponse,
  type ReadState
} from "@myrss/shared";

import { apiRequest } from "./http";

function buildQueryString(query: Partial<ArticleListQuery> = {}) {
  const params = new URLSearchParams();

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.readState) {
    params.set("readState", query.readState);
  }

  if (query.feedId) {
    params.set("feedId", query.feedId);
  }

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.cursor) {
    params.set("cursor", query.cursor);
  }

  params.set("limit", String(query.limit ?? 30));
  return params.toString();
}

export async function getArticles(
  query: Partial<ArticleListQuery> = {}
): Promise<ArticleListResponse> {
  const queryString = buildQueryString(query);
  const payload = await apiRequest(
    queryString ? `/api/v1/articles?${queryString}` : "/api/v1/articles"
  );
  return ArticleListResponseSchema.parse(payload);
}

export async function getArticle(articleId: string): Promise<ArticleDetail> {
  const payload = await apiRequest(
    `/api/v1/articles/${encodeURIComponent(articleId)}`
  );
  return ArticleDetailResponseSchema.parse(payload).data;
}

export async function createManualArticle(url: string): Promise<ArticleDetail> {
  const payload = await apiRequest("/api/v1/articles/manual", {
    method: "POST",
    body: JSON.stringify({ url })
  });
  return ArticleDetailResponseSchema.parse(payload).data;
}

export async function updateArticleReadState(
  articleId: string,
  readState: ReadState
): Promise<ArticleDetail> {
  const payload = await apiRequest(
    `/api/v1/articles/${encodeURIComponent(articleId)}/read-state`,
    {
      method: "PATCH",
      body: JSON.stringify({ readState })
    }
  );
  return ArticleDetailResponseSchema.parse(payload).data;
}

export async function updateArticleFavorite(
  articleId: string,
  favorite: boolean
): Promise<ArticleDetail> {
  const payload = await apiRequest(
    `/api/v1/articles/${encodeURIComponent(articleId)}/favorite`,
    {
      method: "PATCH",
      body: JSON.stringify({ favorite })
    }
  );
  return ArticleDetailResponseSchema.parse(payload).data;
}
