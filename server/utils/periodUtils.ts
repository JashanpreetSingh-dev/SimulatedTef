/**
 * Period utilities for signup-anchored monthly windows (free tier and consistency with paid billing cycles).
 */

/** Add n months to a date (same day of month, capping at last day of month). */
export function addMonths(d: Date, n: number): Date {
  const out = new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
  if (out.getDate() !== d.getDate()) out.setDate(0);
  return out;
}

/** Get the current signup-anchored period [periodStart, periodEnd] (inclusive) containing today. */
export function getFreeTierPeriodFromSignup(signupDate: Date): { periodStart: Date; periodEnd: Date } {
  const start = new Date(signupDate.getFullYear(), signupDate.getMonth(), signupDate.getDate());
  const now = new Date();
  let n = 0;
  while (addMonths(start, n + 1) <= now) n++;
  const periodStart = addMonths(start, n);
  const periodEnd = addMonths(start, n + 1);
  periodEnd.setDate(periodEnd.getDate() - 1);
  return { periodStart, periodEnd };
}
