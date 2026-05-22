import type { RetryPolicy } from "@myrss/shared";

export function computeBackoffMs(
  policy: RetryPolicy,
  attempts: number
): number {
  const exponent = Math.max(0, attempts - 1);
  const base = policy.baseDelayMs * 2 ** exponent;
  return Math.min(base, policy.maxDelayMs);
}
