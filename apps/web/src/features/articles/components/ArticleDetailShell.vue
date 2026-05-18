<script setup lang="ts">
import type { ArticleDetail } from "@myrss/shared";

const props = defineProps<{
  article: ArticleDetail;
}>();

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
</script>

<template>
  <article class="article-detail">
    <header class="article-detail-header">
      <p class="eyebrow">Article detail</p>
      <h1>{{ article.title }}</h1>
      <p class="lede">{{ article.summary ?? "No summary available." }}</p>
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
      <pre class="article-content">{{ formatContent(props.article) }}</pre>
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
  </article>
</template>
