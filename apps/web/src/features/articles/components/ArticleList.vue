<script setup lang="ts">
import { computed } from "vue";

import type { ArticleListItem } from "@myrss/shared";

const props = defineProps<{
  articles: ArticleListItem[];
}>();

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium"
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Unpublished";
}

const isEmpty = computed(() => props.articles.length === 0);
</script>

<template>
  <div v-if="isEmpty" class="empty-state">
    No seed articles yet.
  </div>

  <ul v-else class="article-list">
    <li v-for="article in articles" :key="article.id" class="article-row">
      <RouterLink
        class="article-link"
        :to="{ name: 'article-detail', params: { articleId: article.id } }"
      >
        <div class="article-row-main">
          <div class="article-row-header">
            <h2 class="article-title">{{ article.title }}</h2>
            <span class="pill">{{ article.readState }}</span>
          </div>

          <p class="article-summary">
            {{ article.summaryPreview ?? "No summary available." }}
          </p>

          <div class="article-meta">
            <span>{{ article.feed?.title ?? "No feed" }}</span>
            <span>{{ formatDate(article.publishedAt) }}</span>
            <span>{{ article.sourceCount }} sources</span>
            <span>{{ article.language ?? "und" }}</span>
          </div>
        </div>

        <div class="article-row-side">
          <span class="pill pill-muted">{{ article.status }}</span>
          <span v-if="article.favorite" class="pill">favorite</span>
        </div>
      </RouterLink>
    </li>
  </ul>
</template>
