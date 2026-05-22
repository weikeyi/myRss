<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import type { ArticleListItem } from "@myrss/shared";

import { createManualArticle, getArticles } from "../lib/api/articles.api";
import ArticleList from "../features/articles/components/ArticleList.vue";

const router = useRouter();
const loading = ref(true);
const creating = ref(false);
const errorMessage = ref<string | null>(null);
const manualUrl = ref("");
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

async function submitManualUrl() {
  const url = manualUrl.value.trim();

  if (!url) {
    errorMessage.value = "URL is required";
    return;
  }

  creating.value = true;
  errorMessage.value = null;

  try {
    const article = await createManualArticle(url);
    manualUrl.value = "";
    await loadArticles();
    await router.push({ name: "article-detail", params: { articleId: article.id } });
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to add article";
  } finally {
    creating.value = false;
  }
}

onMounted(loadArticles);
</script>

<template>
  <main class="shell">
    <section class="panel">
      <p class="eyebrow">Reading list</p>
      <h1>Articles</h1>
      <p class="lede">Add a public article URL and let the pipeline fetch readable content.</p>
      <form class="manual-url-form" @submit.prevent="submitManualUrl">
        <label class="sr-only" for="manual-url">Article URL</label>
        <input
          id="manual-url"
          v-model="manualUrl"
          type="url"
          placeholder="https://example.com/article"
          :disabled="creating"
        >
        <button class="primary-button" type="submit" :disabled="creating">
          {{ creating ? "Adding..." : "Add URL" }}
        </button>
      </form>
    </section>

    <section class="panel">
      <p v-if="loading">Loading articles...</p>
      <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
      <ArticleList v-else :articles="articles" />
    </section>
  </main>
</template>
