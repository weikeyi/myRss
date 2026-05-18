import { HealthResponseSchema, type HealthResponse } from "@myrss/shared";

import { apiRequest } from "./http";

export async function getHealth(): Promise<HealthResponse> {
  const payload = await apiRequest("/api/v1/healthz");
  return HealthResponseSchema.parse(payload);
}
