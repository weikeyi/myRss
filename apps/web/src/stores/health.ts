import { defineStore } from "pinia";

import type { HealthResponse } from "@myrss/shared";

import { getHealth } from "../lib/api/health.api";

export const useHealthStore = defineStore("health", {
  state: () => ({
    loading: true,
    errorMessage: null as string | null,
    health: null as HealthResponse | null
  }),
  actions: {
    async loadHealth() {
      this.loading = true;
      this.errorMessage = null;

      try {
        this.health = await getHealth();
      } catch (error) {
        this.errorMessage =
          error instanceof Error ? error.message : "Failed to load health status";
      } finally {
        this.loading = false;
      }
    }
  }
});
