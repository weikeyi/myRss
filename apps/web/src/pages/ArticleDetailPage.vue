<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { ArticleDetail } from "@myrss/shared";

import { getArticle } from "../lib/api/articles.api";
import ArticleDetailShell from "../features/articles/components/ArticleDetailShell.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const errorMessage = ref<string | null>(null);
const article = ref<ArticleDetail | null>(null);

const articleId = computed(() =>
  typeof route.params.articleId === "string" ? route.params.articleId : ""
);

async function loadArticle() {
  if (!articleId.value) {
    errorMessage.value = "Article id is missing";
    loading.value = false;
    return;
  }

  loading.value = true;
  errorMessage.value = null;

  try {
    article.value = await getArticle(articleId.value);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to load article";
  } finally {
    loading.value = false;
  }
}

onMounted(loadArticle);
watch(articleId, loadArticle);
</script>

<template>
  <main class="shell">
    <section class="panel">
      <button class="link-button" type="button" @click="router.push({ name: 'articles' })">
        ← Back to articles
      </button>
    </section>

    <section class="panel">
      <p v-if="loading">Loading article...</p>
      <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
      <ArticleDetailShell v-else-if="article" :article="article" />
    </section>
  </main>
</template>
