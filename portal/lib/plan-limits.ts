/**
 * Plan hour limits per tier.
 * Enforcement is hour-based (seconds). Computed from call_logs each billing period.
 * Billing period = calendar month (resets on the 1st via n8n cron).
 */
export const PLAN_LIMITS = {
  STARTER:    { seconds: 8  * 3600 },   // 28,800 s  (~8 hrs)
  GROWTH:     { seconds: 20 * 3600 },   // 72,000 s  (~20 hrs)
  PRO:        { seconds: 35 * 3600 },   // 126,000 s (~35 hrs)
  ENTERPRISE: { seconds: Infinity },    // No cap
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

/** Returns the start of the current calendar month in UTC. */
export function billingMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Returns limit in seconds for a plan, or Infinity for ENTERPRISE. */
export function planLimitSeconds(plan: string): number {
  return (PLAN_LIMITS as Record<string, { seconds: number }>)[plan]?.seconds ?? PLAN_LIMITS.STARTER.seconds;
}
