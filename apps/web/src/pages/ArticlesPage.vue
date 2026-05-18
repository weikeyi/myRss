<script setup lang="ts">
import { onMounted, ref } from "vue";

import type { ArticleListItem } from "@myrss/shared";

import { getArticles } from "../lib/api/articles.api";
import ArticleList from "../features/articles/components/ArticleList.vue";

const loading = ref(true);
const errorMessage = ref<string | null>(null);
const articles = ref<ArticleListItem[]>([]);

async function loadArticles() {
  loading.value = true;
  errorMessage.value = null;

  try {
    const response = await getArticles({ limit: 30 });
    articles.value = response.data;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to load articles";
  } finally {
    loading.value = false;
  }
}

onMounted(loadArticles);
</script>

<template>
  <main class="shell">
    <section class="panel">
      <p class="eyebrow">Reading list</p>
      <h1>Articles</h1>
      <p class="lede">Seeded article data loaded from SQLite.</p>
    </section>

    <section class="panel">
      <p v-if="loading">Loading articles...</p>
      <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
      <ArticleList v-else :articles="articles" />
    </section>
  </main>
</template>
