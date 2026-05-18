import { Controller, Get } from "@nestjs/common";

import { APP_NAME } from "@myrss/core";
import {
  HealthResponseSchema,
  type HealthResponse
} from "@myrss/shared";

@Controller("healthz")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return HealthResponseSchema.parse({
      status: "ok",
      appName: APP_NAME,
      timestamp: new Date().toISOString()
    });
  }
}
