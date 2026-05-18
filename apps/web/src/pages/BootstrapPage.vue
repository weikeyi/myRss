<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";

import { APP_NAME } from "@myrss/core";

import { useHealthStore } from "../stores/health";

const healthStore = useHealthStore();
const { loading, errorMessage, health } = storeToRefs(healthStore);

onMounted(async () => {
  await healthStore.loadHealth();
});
</script>

<template>
  <main class="shell">
    <section class="panel">
      <p class="eyebrow">Bootstrap</p>
      <h1>{{ APP_NAME }}</h1>
      <p class="lede">The monorepo shell is live.</p>
    </section>

    <section class="panel">
      <h2>Server health</h2>
      <p v-if="loading">Checking...</p>
      <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
      <dl v-else-if="health" class="health">
        <div>
          <dt>Status</dt>
          <dd>{{ health.status }}</dd>
        </div>
        <div>
          <dt>App</dt>
          <dd>{{ health.appName }}</dd>
        </div>
        <div>
          <dt>Timestamp</dt>
          <dd>{{ health.timestamp }}</dd>
        </div>
      </dl>
    </section>
  </main>
</template>
