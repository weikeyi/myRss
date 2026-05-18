import { HealthResponseSchema, type HealthResponse } from "@myrss/shared";

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/v1/healthz", {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Health check failed with ${response.status}`);
  }

  const payload: unknown = await response.json();
  return HealthResponseSchema.parse(payload);
}
