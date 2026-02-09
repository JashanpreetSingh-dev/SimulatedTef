/**
 * User Monthly Usage Service - calculates and checks per-user monthly usage limits
 */

import { connectDB } from '../db/connection';
import { organizationConfigService } from './organizationConfigService';
import { d2cConfigService } from './d2cConfigService';
import { getFreeTierPeriodFromSignup } from '../utils/periodUtils';
import { createUsageEvent, type UsageEventType } from '../models/usageEvent';

export interface MonthlyUsage {
  sectionAUsed: number;
  sectionBUsed: number;
  writtenExpressionSectionAUsed?: number;
  writtenExpressionSectionBUsed?: number;
  mockExamsUsed?: number;
}

export interface CanStartResult {
  canStart: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
}

/**
 * Record a single usage event (for time-boundary queries on resubscribe same day).
 * Call in addition to existing usage doc updates.
 */
export async function recordUsageEvent(
  userId: string,
  date: string,
  type: UsageEventType
): Promise<void> {
  const db = await connectDB();
  const event = createUsageEvent(userId, date, type);
  const { _id, ...doc } = event;
  await db.collection('usageEvents').insertOne(doc as Record<string, unknown>);
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Effective usage period for a paid D2C subscription (resets on upgrade via usageCountingFromDate).
 */
function getEffectivePeriodForSubscription(subscription: {
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usageCountingFromDate?: string;
}): { effectiveStartStr: string; periodEndStr: string } {
  const periodStartStr = subscription.currentPeriodStart.split('T')[0];
  const periodEndStr = subscription.currentPeriodEnd.split('T')[0];
  let effectiveStartStr = subscription.usageCountingFromDate || periodStartStr;
  // Never start after period start so usage on the first day of the period is always included
  if (effectiveStartStr > periodStartStr) {
    effectiveStartStr = periodStartStr;
  }
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2bfb38eb-3761-41c7-8a6d-6153bb8601f3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'userUsageService.ts:getEffectivePeriodForSubscription', message: 'Effective period', data: { periodStartStr, periodEndStr, usageCountingFromDate: subscription.usageCountingFromDate, effectiveStartStr }, timestamp: Date.now(), hypothesisId: 'H2-H4' }) }).catch(() => {});
  // #endregion
  return { effectiveStartStr, periodEndStr };
}

/**
 * Get user's total usage for a specific month
 * @param userId - User ID
 * @param yearMonth - Month in YYYY-MM format (e.g., "2024-01")
 * @returns Monthly usage totals for Section A and Section B
 */
export async function getUserMonthlyUsage(
  userId: string,
  yearMonth: string
): Promise<MonthlyUsage> {
  const db = await connectDB();
  
  // Query all daily usage records for the user in the specified month
  // Date format is YYYY-MM-DD, so we match records starting with YYYY-MM
  const monthPrefix = yearMonth;
  
  const usageRecords = await db
    .collection('usage')
    .find({
      userId,
      date: { $regex: `^${monthPrefix}` },
    })
    .toArray();

  // Sum sectionAUsed, sectionBUsed, and mockExamsUsed across all daily records
  const totals = usageRecords.reduce(
    (acc, record) => {
      return {
        sectionAUsed: acc.sectionAUsed + (record.sectionAUsed || 0),
        sectionBUsed: acc.sectionBUsed + (record.sectionBUsed || 0),
        mockExamsUsed: (acc.mockExamsUsed || 0) + (record.mockExamsUsed || 0),
      };
    },
    { sectionAUsed: 0, sectionBUsed: 0, mockExamsUsed: 0 }
  );

  return totals;
}

/**
 * Sum usage events for one day from a minimum timestamp (for resubscribe same-day boundary).
 */
async function getUsageEventsForDay(
  userId: string,
  dateStr: string,
  createdAtMin: string
): Promise<{ sectionAUsed: number; sectionBUsed: number; writtenExpressionSectionAUsed: number; writtenExpressionSectionBUsed: number; mockExamsUsed: number }> {
  const db = await connectDB();
  const events = await db
    .collection('usageEvents')
    .find({
      userId,
      date: dateStr,
      createdAt: { $gte: createdAtMin },
    })
    .toArray();
  const out = {
    sectionAUsed: 0,
    sectionBUsed: 0,
    writtenExpressionSectionAUsed: 0,
    writtenExpressionSectionBUsed: 0,
    mockExamsUsed: 0,
  };
  for (const e of events) {
    const t = (e as unknown as { type: string }).type;
    if (t === 'sectionA') out.sectionAUsed++;
    else if (t === 'sectionB') out.sectionBUsed++;
    else if (t === 'writtenExpressionSectionA') out.writtenExpressionSectionAUsed++;
    else if (t === 'writtenExpressionSectionB') out.writtenExpressionSectionBUsed++;
    else if (t === 'mockExam') out.mockExamsUsed++;
    else if (t === 'fullExam') {
      out.sectionAUsed++;
      out.sectionBUsed++;
    }
  }
  return out;
}

/**
 * Get user's usage within a date range (for subscription billing cycle).
 * When startDateTimeMin is set (resubscribe), usage on the start day is counted only if createdAt >= startDateTimeMin (from usageEvents).
 */
export async function getUserUsageInRange(
  userId: string,
  startDate: string,
  endDate: string,
  startDateTimeMin?: string
): Promise<MonthlyUsage> {
  const db = await connectDB();
  const startDateStr = startDate.includes('T') ? startDate.split('T')[0] : startDate;
  const endDateStr = endDate.includes('T') ? endDate.split('T')[0] : endDate;

  if (startDateTimeMin && startDateStr === endDateStr) {
    return getUsageEventsForDay(userId, startDateStr, startDateTimeMin);
  }

  if (!startDateTimeMin) {
    const usageRecords = await db
      .collection('usage')
      .find({
        userId,
        date: { $gte: startDateStr, $lte: endDateStr },
      })
      .toArray();
    return usageRecords.reduce(
      (acc: MonthlyUsage, record: Record<string, number>) => ({
        sectionAUsed: acc.sectionAUsed + (record.sectionAUsed || 0),
        sectionBUsed: acc.sectionBUsed + (record.sectionBUsed || 0),
        writtenExpressionSectionAUsed: (acc.writtenExpressionSectionAUsed || 0) + (record.writtenExpressionSectionAUsed || 0),
        writtenExpressionSectionBUsed: (acc.writtenExpressionSectionBUsed || 0) + (record.writtenExpressionSectionBUsed || 0),
        mockExamsUsed: acc.mockExamsUsed + (record.mockExamsUsed || 0),
      }),
      { sectionAUsed: 0, sectionBUsed: 0, writtenExpressionSectionAUsed: 0, writtenExpressionSectionBUsed: 0, mockExamsUsed: 0 }
    );
  }

  const startDayUsage = await getUsageEventsForDay(userId, startDateStr, startDateTimeMin);
  const restRecords = await db
    .collection('usage')
    .find({
      userId,
      date: { $gt: startDateStr, $lte: endDateStr },
    })
    .toArray();
  const rest = restRecords.reduce(
    (acc: MonthlyUsage, record: Record<string, number>) => ({
      sectionAUsed: acc.sectionAUsed + (record.sectionAUsed || 0),
      sectionBUsed: acc.sectionBUsed + (record.sectionBUsed || 0),
      writtenExpressionSectionAUsed: (acc.writtenExpressionSectionAUsed || 0) + (record.writtenExpressionSectionAUsed || 0),
      writtenExpressionSectionBUsed: (acc.writtenExpressionSectionBUsed || 0) + (record.writtenExpressionSectionBUsed || 0),
      mockExamsUsed: acc.mockExamsUsed + (record.mockExamsUsed || 0),
    }),
    { sectionAUsed: 0, sectionBUsed: 0, writtenExpressionSectionAUsed: 0, writtenExpressionSectionBUsed: 0, mockExamsUsed: 0 }
  );
  return {
    sectionAUsed: startDayUsage.sectionAUsed + rest.sectionAUsed,
    sectionBUsed: startDayUsage.sectionBUsed + rest.sectionBUsed,
    writtenExpressionSectionAUsed: startDayUsage.writtenExpressionSectionAUsed + (rest.writtenExpressionSectionAUsed || 0),
    writtenExpressionSectionBUsed: startDayUsage.writtenExpressionSectionBUsed + (rest.writtenExpressionSectionBUsed || 0),
    mockExamsUsed: startDayUsage.mockExamsUsed + rest.mockExamsUsed,
  };
}

/**
 * Get user's monthly mock exam usage
 * @param userId - User ID
 * @param yearMonth - Month in YYYY-MM format (e.g., "2024-01")
 * @returns Monthly mock exam usage count
 */
export async function getUserMonthlyMockExamUsage(
  userId: string,
  yearMonth: string
): Promise<number> {
  const db = await connectDB();
  
  const monthPrefix = yearMonth;
  
  const usageRecords = await db
    .collection('usage')
    .find({
      userId,
      date: { $regex: `^${monthPrefix}` },
    })
    .toArray();

  // Sum mockExamsUsed across all daily records
  const total = usageRecords.reduce(
    (acc, record) => acc + (record.mockExamsUsed || 0),
    0
  );

  return total;
}

/**
 * Get user's monthly written expression usage (Section A + B combined)
 * @param userId - User ID
 * @param yearMonth - Month in YYYY-MM format (e.g., "2024-01")
 * @returns Monthly written expression usage count
 */
export async function getUserMonthlyWrittenExpressionUsage(
  userId: string,
  yearMonth: string
): Promise<number> {
  const db = await connectDB();

  const monthPrefix = yearMonth;

  const usageRecords = await db
    .collection('usage')
    .find({
      userId,
      date: { $regex: `^${monthPrefix}` },
    })
    .toArray();

  const total = usageRecords.reduce(
    (acc, record) =>
      acc +
      (record.writtenExpressionSectionAUsed || 0) +
      (record.writtenExpressionSectionBUsed || 0),
    0
  );

  return total;
}

/**
 * Get limits for D2C user (check subscription first, fallback to D2C config)
 * @param userId - User ID
 * @returns Limits object
 */
async function getD2CLimits(userId: string): Promise<{
  sectionALimit: number;
  sectionBLimit: number;
  writtenExpressionSectionALimit: number;
  writtenExpressionSectionBLimit: number;
  mockExamLimit: number;
}> {
  // Check if user has active subscription
  // Note: Even if cancelAtPeriodEnd is true, subscription is still 'active' until period ends
  // This ensures users retain access for the remainder of their paid period
  const db = await connectDB();
  const subscription = await db.collection('subscriptions').findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  });

  if (subscription) {
    // Get subscription tier limits
    const tier = await db.collection('subscriptionTiers').findOne({
      id: subscription.tier,
    });

    if (tier && tier.limits) {
      return {
        sectionALimit: tier.limits.sectionALimit,
        sectionBLimit: tier.limits.sectionBLimit,
        writtenExpressionSectionALimit: tier.limits.writtenExpressionSectionALimit,
        writtenExpressionSectionBLimit: tier.limits.writtenExpressionSectionBLimit,
        mockExamLimit: tier.limits.mockExamLimit || 1,
      };
    }
  }

  // Fallback to D2C config defaults
  const d2cConfig = await d2cConfigService.getConfig();
  return {
    sectionALimit: d2cConfig.sectionALimit,
    sectionBLimit: d2cConfig.sectionBLimit,
    writtenExpressionSectionALimit: d2cConfig.writtenExpressionSectionALimit,
    writtenExpressionSectionBLimit: d2cConfig.writtenExpressionSectionBLimit,
    mockExamLimit: d2cConfig.mockExamLimit,
  };
}

/** Get current period for D2C free tier from persisted freeTierPeriodStart, or null to use calendar month.
 * If downgradedToFreeAt is set, usage is only counted from that date (so paid-period usage doesn't count against free limit). */
async function getD2CFreeTierPeriod(userId: string): Promise<{ periodStart: string; periodEnd: string } | null> {
  const db = await connectDB();
  const subscription = await db.collection('subscriptions').findOne({ userId }) as { freeTierPeriodStart?: string; downgradedToFreeAt?: string } | null;
  const anchor = subscription?.freeTierPeriodStart;
  if (!anchor) return null;
  const { periodStart, periodEnd } = getFreeTierPeriodFromSignup(new Date(anchor));
  let periodStartStr = periodStart.toISOString().split('T')[0];
  const periodEndStr = periodEnd.toISOString().split('T')[0];
  const downgradedAt = subscription?.downgradedToFreeAt;
  if (downgradedAt) {
    const downgradedDateStr = downgradedAt.split('T')[0];
    if (downgradedDateStr > periodStartStr) {
      periodStartStr = downgradedDateStr;
    }
  }
  return { periodStart: periodStartStr, periodEnd: periodEndStr };
}

/**
 * Check if user can start a specific section (A or B)
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param section - 'A' or 'B'
 * @returns Result indicating if user can start and current usage/limit info
 */
export async function checkCanStartSection(
  userId: string,
  orgId: string | null,
  section: 'A' | 'B'
): Promise<CanStartResult> {
  let usage: MonthlyUsage;
  let limit: number;
  
  if (orgId) {
    // B2B user - use org config and calendar month
    const currentMonth = getCurrentMonth();
    usage = await getUserMonthlyUsage(userId, currentMonth);
    const config = await organizationConfigService.getConfig(orgId);
    limit = section === 'A' ? config.sectionALimit : config.sectionBLimit;
  } else {
    // D2C user - subscription billing cycle or signup-anchored month for free tier
    const db = await connectDB();
    const subscription = await db.collection('subscriptions').findOne({
      userId,
      status: { $in: ['active', 'trialing'] },
    });
    
    if (subscription && subscription.currentPeriodStart && subscription.currentPeriodEnd) {
      const { effectiveStartStr, periodEndStr } = getEffectivePeriodForSubscription({
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        usageCountingFromDate: subscription.usageCountingFromDate,
      });
      const timeMin = (subscription as { usageCountingFromTime?: string }).usageCountingFromTime;
      usage = await getUserUsageInRange(userId, effectiveStartStr, periodEndStr, timeMin);
    } else {
      // Free tier - signup-anchored month if we have it, else calendar month
      const freePeriod = await getD2CFreeTierPeriod(userId);
      if (freePeriod) {
        usage = await getUserUsageInRange(userId, freePeriod.periodStart, freePeriod.periodEnd);
      } else {
        const currentMonth = getCurrentMonth();
        usage = await getUserMonthlyUsage(userId, currentMonth);
      }
    }
    
    // Get limits
    const d2cLimits = await getD2CLimits(userId);
    limit = section === 'A' ? d2cLimits.sectionALimit : d2cLimits.sectionBLimit;
  }
  
  const currentUsage = section === 'A' ? usage.sectionAUsed : usage.sectionBUsed;
  
  if (currentUsage >= limit) {
    return {
      canStart: false,
      reason: `Monthly limit reached: ${currentUsage}/${limit} Section ${section} attempts used this billing period`,
      currentUsage,
      limit,
    };
  }
  
  return {
    canStart: true,
    currentUsage,
    limit,
  };
}

/**
 * Check if user can start a full exam (both Section A and B)
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns Result indicating if user can start and current usage/limit info
 */
export async function checkCanStartFullExam(
  userId: string,
  orgId: string | null
): Promise<CanStartResult> {
  // Check both sections
  const sectionACheck = await checkCanStartSection(userId, orgId, 'A');
  const sectionBCheck = await checkCanStartSection(userId, orgId, 'B');
  
  // User can start full exam only if both sections are available
  if (!sectionACheck.canStart) {
    return sectionACheck;
  }
  
  if (!sectionBCheck.canStart) {
    return sectionBCheck;
  }
  
  // Return combined info (use Section A's limit as reference)
  return {
    canStart: true,
    currentUsage: sectionACheck.currentUsage + sectionBCheck.currentUsage,
    limit: sectionACheck.limit + sectionBCheck.limit,
  };
}

/**
 * Get user's written expression Section A usage within a date range.
 * When startDateTimeMin is set, usage on the start day is from events (createdAt >= startDateTimeMin).
 */
export async function getUserWrittenExpressionSectionAUsageInRange(
  userId: string,
  startDate: string,
  endDate: string,
  startDateTimeMin?: string
): Promise<number> {
  const startDateStr = startDate.includes('T') ? startDate.split('T')[0] : startDate;
  const endDateStr = endDate.includes('T') ? endDate.split('T')[0] : endDate;
  if (startDateTimeMin) {
    const startDay = await getUsageEventsForDay(userId, startDateStr, startDateTimeMin);
    if (startDateStr === endDateStr) return startDay.writtenExpressionSectionAUsed;
    const db = await connectDB();
    const rest = await db.collection('usage').find({
      userId,
      date: { $gt: startDateStr, $lte: endDateStr },
    }).toArray();
    const restTotal = (rest as { writtenExpressionSectionAUsed?: number }[]).reduce((acc, r) => acc + (r.writtenExpressionSectionAUsed || 0), 0);
    return startDay.writtenExpressionSectionAUsed + restTotal;
  }
  const db = await connectDB();
  const usageRecords = await db.collection('usage').find({
    userId,
    date: { $gte: startDateStr, $lte: endDateStr },
  }).toArray();
  return (usageRecords as { writtenExpressionSectionAUsed?: number }[]).reduce((acc, r) => acc + (r.writtenExpressionSectionAUsed || 0), 0);
}

/**
 * Get user's written expression Section B usage within a date range.
 * When startDateTimeMin is set, usage on the start day is from events (createdAt >= startDateTimeMin).
 */
export async function getUserWrittenExpressionSectionBUsageInRange(
  userId: string,
  startDate: string,
  endDate: string,
  startDateTimeMin?: string
): Promise<number> {
  const startDateStr = startDate.includes('T') ? startDate.split('T')[0] : startDate;
  const endDateStr = endDate.includes('T') ? endDate.split('T')[0] : endDate;
  if (startDateTimeMin) {
    const startDay = await getUsageEventsForDay(userId, startDateStr, startDateTimeMin);
    if (startDateStr === endDateStr) return startDay.writtenExpressionSectionBUsed;
    const db = await connectDB();
    const rest = await db.collection('usage').find({
      userId,
      date: { $gt: startDateStr, $lte: endDateStr },
    }).toArray();
    const restTotal = (rest as { writtenExpressionSectionBUsed?: number }[]).reduce((acc, r) => acc + (r.writtenExpressionSectionBUsed || 0), 0);
    return startDay.writtenExpressionSectionBUsed + restTotal;
  }
  const db = await connectDB();
  const usageRecords = await db.collection('usage').find({
    userId,
    date: { $gte: startDateStr, $lte: endDateStr },
  }).toArray();
  return (usageRecords as { writtenExpressionSectionBUsed?: number }[]).reduce((acc, r) => acc + (r.writtenExpressionSectionBUsed || 0), 0);
}

/**
 * Get user's monthly written expression Section A usage
 * @param userId - User ID
 * @param yearMonth - Month in YYYY-MM format (e.g., "2024-01")
 * @returns Monthly written expression Section A usage count
 */
export async function getUserMonthlyWrittenExpressionSectionAUsage(
  userId: string,
  yearMonth: string
): Promise<number> {
  const db = await connectDB();
  
  const monthPrefix = yearMonth;
  
  const usageRecords = await db
    .collection('usage')
    .find({
      userId,
      date: { $regex: `^${monthPrefix}` },
    })
    .toArray();

  // Sum writtenExpressionSectionAUsed across all daily records
  const total = usageRecords.reduce(
    (acc, record) => acc + (record.writtenExpressionSectionAUsed || 0),
    0
  );

  return total;
}

/**
 * Get user's monthly written expression Section B usage
 * @param userId - User ID
 * @param yearMonth - Month in YYYY-MM format (e.g., "2024-01")
 * @returns Monthly written expression Section B usage count
 */
export async function getUserMonthlyWrittenExpressionSectionBUsage(
  userId: string,
  yearMonth: string
): Promise<number> {
  const db = await connectDB();
  
  const monthPrefix = yearMonth;
  
  const usageRecords = await db
    .collection('usage')
    .find({
      userId,
      date: { $regex: `^${monthPrefix}` },
    })
    .toArray();

  // Sum writtenExpressionSectionBUsed across all daily records
  const total = usageRecords.reduce(
    (acc, record) => acc + (record.writtenExpressionSectionBUsed || 0),
    0
  );

  return total;
}

/**
 * Check if user can start written expression (Section A or B)
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param section - 'A' or 'B' for written expression
 * @returns Result indicating if user can start and current usage/limit info
 */
export async function checkCanStartWrittenExpression(
  userId: string,
  orgId: string | null,
  section: 'A' | 'B'
): Promise<CanStartResult> {
  let currentUsage: number;
  let limit: number;
  
  if (orgId) {
    // B2B user - unlimited for now (can be configured later)
    limit = -1; // -1 indicates unlimited for B2B
    currentUsage = 0; // Not tracked for B2B
  } else {
    // D2C user - check subscription billing cycle or calendar month for free tier
    const db = await connectDB();
    const subscription = await db.collection('subscriptions').findOne({
      userId,
      status: { $in: ['active', 'trialing'] },
    });
    
    if (subscription && subscription.currentPeriodStart && subscription.currentPeriodEnd) {
      // Paid subscription - use billing cycle (effective start resets usage on upgrade)
      const { effectiveStartStr, periodEndStr } = getEffectivePeriodForSubscription({
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        usageCountingFromDate: subscription.usageCountingFromDate,
      });
      const timeMin = (subscription as { usageCountingFromTime?: string }).usageCountingFromTime;
      if (section === 'A') {
        currentUsage = await getUserWrittenExpressionSectionAUsageInRange(userId, effectiveStartStr, periodEndStr, timeMin);
      } else {
        currentUsage = await getUserWrittenExpressionSectionBUsageInRange(userId, effectiveStartStr, periodEndStr, timeMin);
      }
    } else {
      // Free tier - signup-anchored month if we have it, else calendar month
      const freePeriod = await getD2CFreeTierPeriod(userId);
      if (freePeriod) {
        if (section === 'A') {
          currentUsage = await getUserWrittenExpressionSectionAUsageInRange(userId, freePeriod.periodStart, freePeriod.periodEnd);
        } else {
          currentUsage = await getUserWrittenExpressionSectionBUsageInRange(userId, freePeriod.periodStart, freePeriod.periodEnd);
        }
      } else {
        const currentMonth = getCurrentMonth();
        if (section === 'A') {
          currentUsage = await getUserMonthlyWrittenExpressionSectionAUsage(userId, currentMonth);
        } else {
          currentUsage = await getUserMonthlyWrittenExpressionSectionBUsage(userId, currentMonth);
        }
      }
    }
    
    // Get limits
    const d2cLimits = await getD2CLimits(userId);
    limit = section === 'A' ? d2cLimits.writtenExpressionSectionALimit : d2cLimits.writtenExpressionSectionBLimit;
  }
  
  // If limit is -1, it's unlimited
  if (limit === -1) {
    return {
      canStart: true,
      currentUsage,
      limit: -1,
    };
  }
  
  if (currentUsage >= limit) {
    return {
      canStart: false,
      reason: `Monthly limit reached: ${currentUsage}/${limit} written expression Section ${section} attempts used this billing period`,
      currentUsage,
      limit,
    };
  }
  
  return {
    canStart: true,
    currentUsage,
    limit,
  };
}

/**
 * Get user's mock exam usage within a date range (for subscription billing cycle).
 * When startDateTimeMin is set, usage on the start day is from events (createdAt >= startDateTimeMin).
 */
export async function getUserMockExamUsageInRange(
  userId: string,
  startDate: string,
  endDate: string,
  startDateTimeMin?: string
): Promise<number> {
  const startDateStr = startDate.includes('T') ? startDate.split('T')[0] : startDate;
  const endDateStr = endDate.includes('T') ? endDate.split('T')[0] : endDate;
  if (startDateTimeMin) {
    const startDay = await getUsageEventsForDay(userId, startDateStr, startDateTimeMin);
    if (startDateStr === endDateStr) return startDay.mockExamsUsed;
    const db = await connectDB();
    const rest = await db.collection('usage').find({
      userId,
      date: { $gt: startDateStr, $lte: endDateStr },
    }).toArray();
    const restTotal = (rest as { mockExamsUsed?: number }[]).reduce((acc, r) => acc + (r.mockExamsUsed || 0), 0);
    return startDay.mockExamsUsed + restTotal;
  }
  const db = await connectDB();
  const usageRecords = await db.collection('usage').find({
    userId,
    date: { $gte: startDateStr, $lte: endDateStr },
  }).toArray();
  return (usageRecords as { mockExamsUsed?: number }[]).reduce((acc, r) => acc + (r.mockExamsUsed || 0), 0);
}

/**
 * Get user's written expression usage (Section A + B combined) within a date range (for subscription billing cycle)
 * @param userId - User ID
 * @param startDate - Start date (ISO string or YYYY-MM-DD)
 * @param endDate - End date (ISO string or YYYY-MM-DD)
 * @returns Written expression usage count
 */
export async function getUserWrittenExpressionUsageInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const db = await connectDB();

  const startDateStr = startDate.includes('T')
    ? startDate.split('T')[0]
    : startDate;
  const endDateStr = endDate.includes('T') ? endDate.split('T')[0] : endDate;

  const usageRecords = await db
    .collection('usage')
    .find({
      userId,
      date: { $gte: startDateStr, $lte: endDateStr },
    })
    .toArray();

  const total = usageRecords.reduce(
    (acc, record) =>
      acc +
      (record.writtenExpressionSectionAUsed || 0) +
      (record.writtenExpressionSectionBUsed || 0),
    0
  );

  return total;
}

/**
 * Check if user can start a mock exam
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns Result indicating if user can start and current usage/limit info
 */
export async function checkCanStartMockExam(
  userId: string,
  orgId: string | null
): Promise<CanStartResult> {
  let currentUsage: number;
  let limit: number;
  
  if (orgId) {
    // B2B users - unlimited mock exams, use calendar month for tracking
    const currentMonth = getCurrentMonth();
    currentUsage = await getUserMonthlyMockExamUsage(userId, currentMonth);
    limit = -1; // -1 indicates unlimited
  } else {
    // D2C user - check subscription billing cycle or calendar month for free tier
    const db = await connectDB();
    const subscription = await db.collection('subscriptions').findOne({
      userId,
      status: { $in: ['active', 'trialing'] },
    });
    
    if (subscription && subscription.currentPeriodStart && subscription.currentPeriodEnd) {
      // Paid subscription - use billing cycle (effective start resets usage on upgrade)
      const { effectiveStartStr, periodEndStr } = getEffectivePeriodForSubscription({
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        usageCountingFromDate: subscription.usageCountingFromDate,
      });
      const timeMin = (subscription as { usageCountingFromTime?: string }).usageCountingFromTime;
      currentUsage = await getUserMockExamUsageInRange(userId, effectiveStartStr, periodEndStr, timeMin);
    } else {
      // Free tier - signup-anchored month if we have it, else calendar month
      const freePeriod = await getD2CFreeTierPeriod(userId);
      if (freePeriod) {
        currentUsage = await getUserMockExamUsageInRange(userId, freePeriod.periodStart, freePeriod.periodEnd);
      } else {
        const currentMonth = getCurrentMonth();
        currentUsage = await getUserMonthlyMockExamUsage(userId, currentMonth);
      }
    }
    
    // Get limits
    const d2cLimits = await getD2CLimits(userId);
    limit = d2cLimits.mockExamLimit;
  }
  
  // If limit is -1, it's unlimited
  if (limit === -1) {
    return {
      canStart: true,
      currentUsage,
      limit: -1,
    };
  }
  
  if (currentUsage >= limit) {
    return {
      canStart: false,
      reason: `Monthly limit reached: ${currentUsage}/${limit} mock exams used this billing period`,
      currentUsage,
      limit,
    };
  }
  
  return {
    canStart: true,
    currentUsage,
    limit,
  };
}

export const userUsageService = {
  getCurrentMonth,
  getUserMonthlyUsage,
  getUserMonthlyMockExamUsage,
  getUserMonthlyWrittenExpressionUsage,
  getUserMonthlyWrittenExpressionSectionAUsage,
  getUserMonthlyWrittenExpressionSectionBUsage,
  getUserUsageInRange,
  getUserMockExamUsageInRange,
  getUserWrittenExpressionUsageInRange,
  getUserWrittenExpressionSectionAUsageInRange,
  getUserWrittenExpressionSectionBUsageInRange,
  checkCanStartSection,
  checkCanStartFullExam,
  checkCanStartWrittenExpression,
  checkCanStartMockExam,
  recordUsageEvent,
};
