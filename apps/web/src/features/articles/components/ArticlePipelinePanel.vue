<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

import type { PipelineRun } from "@myrss/shared";

import { getArticlePipeline, startArticlePipeline } from "../../../lib/api/pipeline.api";

const props = defineProps<{
  articleId: string;
}>();

const emit = defineEmits<{
  "pipeline-updated": [];
}>();

const pipeline = ref<PipelineRun | null>(null);
const loading = ref(false);
const starting = ref(false);
const errorMessage = ref<string | null>(null);
let pollingHandle: number | null = null;

const isActive = computed(() => {
  const status = pipeline.value?.status;
  return status === "pending" || status === "running";
});

const startButtonLabel = computed(() => {
  if (starting.value) {
    return "Starting...";
  }

  return pipeline.value?.status === "failed" ? "Retry pipeline" : "Start pipeline";
});

function shouldRefreshArticle(run: PipelineRun | null) {
  return Boolean(run && run.status !== "pending" && run.status !== "running");
}

function stopPolling() {
  if (pollingHandle !== null) {
    window.clearInterval(pollingHandle);
    pollingHandle = null;
  }
}

function startPolling() {
  if (pollingHandle !== null) {
    return;
  }

  pollingHandle = window.setInterval(() => {
    void loadPipeline();
  }, 2000);
}

async function loadPipeline() {
  if (!props.articleId) {
    pipeline.value = null;
    return;
  }

  if (loading.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = null;

  try {
    pipeline.value = await getArticlePipeline(props.articleId);

    if (shouldRefreshArticle(pipeline.value)) {
      emit("pipeline-updated");
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to load pipeline";
  } finally {
    loading.value = false;
  }
}

async function startPipeline() {
  starting.value = true;
  errorMessage.value = null;

  try {
    pipeline.value = await startArticlePipeline(props.articleId);

    if (shouldRefreshArticle(pipeline.value)) {
      emit("pipeline-updated");
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to start pipeline";
  } finally {
    starting.value = false;
  }
}

watch(
  () => props.articleId,
  () => {
    stopPolling();
    void loadPipeline();
  },
  { immediate: true }
);

watch(
  isActive,
  (active) => {
    if (active) {
      startPolling();
      return;
    }

    stopPolling();
  },
  { immediate: true }
);

onBeforeUnmount(stopPolling);
</script>

<template>
  <section class="article-detail-section">
    <div class="pipeline-header">
      <div>
        <h2>Pipeline</h2>
        <p class="lede">
          {{ pipeline ? `Latest run ${pipeline.status}` : "No pipeline run yet." }}
        </p>
      </div>

      <div class="pipeline-actions">
        <button
          class="link-button"
          type="button"
          :disabled="starting || loading || isActive"
          @click="startPipeline"
        >
          {{ startButtonLabel }}
        </button>
        <button class="link-button" type="button" :disabled="loading" @click="loadPipeline">
          Refresh
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-else-if="loading && !pipeline">Loading pipeline...</p>

    <div v-else-if="pipeline" class="pipeline-body">
      <dl class="pipeline-meta">
        <div>
          <dt>Run status</dt>
          <dd>{{ pipeline.status }}</dd>
        </div>
        <div>
          <dt>Trigger</dt>
          <dd>{{ pipeline.trigger }}</dd>
        </div>
        <div>
          <dt>Current step</dt>
          <dd>{{ pipeline.currentStepKey ?? "Complete" }}</dd>
        </div>
        <div>
          <dt>Steps</dt>
          <dd>{{ pipeline.steps.length }}</dd>
        </div>
      </dl>

      <ul class="pipeline-step-list">
        <li v-for="step in pipeline.steps" :key="step.id" class="pipeline-step-row">
          <div>
            <strong>{{ step.stepKey }}</strong>
            <p>{{ step.stepType }}</p>
          </div>
          <div class="pipeline-step-side">
            <span class="pill">{{ step.status }}</span>
            <span class="pipeline-step-attempts">{{ step.attempts }}/{{ step.maxAttempts }}</span>
            <span v-if="step.errorMessage" class="pipeline-step-error">
              {{ step.errorMessage }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.pipeline-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.pipeline-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.pipeline-body {
  display: grid;
  gap: 16px;
}

.pipeline-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  margin: 0;
}

.pipeline-meta div {
  display: grid;
  gap: 4px;
}

.pipeline-meta dt {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #52616b;
}

.pipeline-meta dd {
  margin: 0;
  font-weight: 600;
}

.pipeline-step-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.pipeline-step-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #d9e1e8;
}

.pipeline-step-row:first-child {
  border-top: none;
}

.pipeline-step-row p {
  margin: 4px 0 0;
  color: #52616b;
}

.pipeline-step-side {
  display: grid;
  justify-items: end;
  gap: 6px;
}

.pipeline-step-attempts {
  font-size: 12px;
  color: #52616b;
}

.pipeline-step-error {
  max-width: 280px;
  color: #b42318;
  font-size: 12px;
  text-align: right;
}

@media (max-width: 640px) {
  .pipeline-header,
  .pipeline-step-row {
    flex-direction: column;
  }

  .pipeline-step-side {
    justify-items: start;
  }

  .pipeline-step-error {
    text-align: left;
  }

  .pipeline-meta {
    grid-template-columns: 1fr;
  }
}
</style>
