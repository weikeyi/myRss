<script setup lang="ts">
import { ref } from "vue";

import type { ArticleDetail, ReadState } from "@myrss/shared";

import {
  updateArticleFavorite,
  updateArticleReadState
} from "../../../lib/api/articles.api";

import ArticlePipelinePanel from "./ArticlePipelinePanel.vue";
import MarkdownContent from "./MarkdownContent.vue";

const props = defineProps<{
  article: ArticleDetail;
}>();

const emit = defineEmits<{
  "article-updated": [article: ArticleDetail];
  "pipeline-updated": [];
}>();

const updating = ref(false);
const updateError = ref<string | null>(null);

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium"
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Unpublished";
}

function formatContent(article: ArticleDetail) {
  return (
    article.content?.markdownContent ??
    article.content?.textContent ??
    "No extracted content is available yet."
  );
}

function getSourceLabel(article: ArticleDetail) {
  const source = article.sources[0];
  return source?.feedTitle ?? "Manual source";
}

function getFeedLabel(article: ArticleDetail) {
  return article.feed?.title ?? getSourceLabel(article);
}

async function setReadState(readState: ReadState) {
  updating.value = true;
  updateError.value = null;

  try {
    emit("article-updated", await updateArticleReadState(props.article.id, readState));
  } catch (error) {
    updateError.value =
      error instanceof Error ? error.message : "Failed to update read state";
  } finally {
    updating.value = false;
  }
}

async function toggleFavorite() {
  updating.value = true;
  updateError.value = null;

  try {
    emit(
      "article-updated",
      await updateArticleFavorite(props.article.id, !props.article.favorite)
    );
  } catch (error) {
    updateError.value =
      error instanceof Error ? error.message : "Failed to update favorite";
  } finally {
    updating.value = false;
  }
}
</script>

<template>
  <article class="article-detail">
    <header class="article-detail-header">
      <p class="eyebrow">Article detail</p>
      <h1>{{ article.title }}</h1>
      <p class="lede">{{ article.summary ?? "No summary available." }}</p>
      <div class="article-actions">
        <button
          class="link-button"
          type="button"
          :disabled="updating"
          @click="toggleFavorite"
        >
          {{ article.favorite ? "Remove favorite" : "Mark favorite" }}
        </button>
        <button class="link-button" type="button" :disabled="updating" @click="setReadState('unread')">
          Unread
        </button>
        <button class="link-button" type="button" :disabled="updating" @click="setReadState('reading')">
          Reading
        </button>
        <button class="link-button" type="button" :disabled="updating" @click="setReadState('read')">
          Read
        </button>
      </div>
      <p v-if="updateError" class="error">{{ updateError }}</p>
    </header>

    <dl class="article-detail-meta">
      <div>
        <dt>Source</dt>
        <dd>{{ getFeedLabel(props.article) }}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>{{ article.status }}</dd>
      </div>
      <div>
        <dt>Read state</dt>
        <dd>{{ article.readState }}</dd>
      </div>
      <div>
        <dt>Published</dt>
        <dd>{{ formatDate(article.publishedAt) }}</dd>
      </div>
    </dl>

    <section class="article-detail-section">
      <h2>Content</h2>
      <MarkdownContent :content="formatContent(props.article)" />
    </section>

    <section class="article-detail-section">
      <h2>Sources</h2>
      <ul class="source-list">
        <li v-for="source in article.sources" :key="source.id" class="source-row">
          <div>
            <strong>{{ source.feedTitle ?? "Manual source" }}</strong>
            <p>{{ source.originalUrl }}</p>
          </div>
          <span>{{ source.sourceType }}</span>
        </li>
      </ul>
    </section>

    <ArticlePipelinePanel
      :article-id="article.id"
      @pipeline-updated="emit('pipeline-updated')"
    />
  </article>
</template>
