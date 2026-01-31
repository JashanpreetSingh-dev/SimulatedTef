/**
 * User Monthly Usage Service - calculates and checks per-user monthly usage limits
 */

import { connectDB } from '../db/connection';
import { getDefaultConfig } from '../models/OrganizationConfig';
import { organizationConfigService } from './organizationConfigService';

export interface MonthlyUsage {
  sectionAUsed: number;
  sectionBUsed: number;
}

export interface CanStartResult {
  canStart: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
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

  // Sum sectionAUsed and sectionBUsed across all daily records
  const totals = usageRecords.reduce(
    (acc, record) => {
      return {
        sectionAUsed: acc.sectionAUsed + (record.sectionAUsed || 0),
        sectionBUsed: acc.sectionBUsed + (record.sectionBUsed || 0),
      };
    },
    { sectionAUsed: 0, sectionBUsed: 0 }
  );

  return totals;
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
  // Get current month
  const currentMonth = getCurrentMonth();
  
  // Get user's monthly usage
  const usage = await getUserMonthlyUsage(userId, currentMonth);
  
  // Get org config (or defaults)
  const config = orgId
    ? await organizationConfigService.getConfig(orgId)
    : getDefaultConfig();
  
  const limit = section === 'A' ? config.sectionALimit : config.sectionBLimit;
  const currentUsage = section === 'A' ? usage.sectionAUsed : usage.sectionBUsed;
  
  if (currentUsage >= limit) {
    return {
      canStart: false,
      reason: `Monthly limit reached: ${currentUsage}/${limit} Section ${section} attempts used this month`,
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

export const userUsageService = {
  getCurrentMonth,
  getUserMonthlyUsage,
  checkCanStartSection,
  checkCanStartFullExam,
};
