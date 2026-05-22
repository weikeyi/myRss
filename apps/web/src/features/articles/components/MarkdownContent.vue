<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed } from "vue";

const props = defineProps<{
  content: string;
}>();

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

const renderedContent = computed(() => markdown.render(props.content));
</script>

<template>
  <div class="markdown-content" v-html="renderedContent" />
</template>

<style scoped>
.markdown-content {
  padding: 16px;
  border: 1px solid #d9e1e8;
  border-radius: 8px;
  background: #f8fafc;
  color: #15202b;
}

.markdown-content :deep(*) {
  max-width: 100%;
}

.markdown-content :deep(p),
.markdown-content :deep(ul),
.markdown-content :deep(ol),
.markdown-content :deep(blockquote),
.markdown-content :deep(pre) {
  margin: 0 0 12px;
}

.markdown-content :deep(p:last-child),
.markdown-content :deep(ul:last-child),
.markdown-content :deep(ol:last-child),
.markdown-content :deep(blockquote:last-child),
.markdown-content :deep(pre:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(a) {
  color: #1d4ed8;
}

.markdown-content :deep(pre),
.markdown-content :deep(code) {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
