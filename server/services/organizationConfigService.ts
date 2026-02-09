/**
 * Organization Config Service - manages organization-level configuration for usage limits
 */

import { connectDB } from '../db/connection';
import {
  OrganizationConfig,
  createOrganizationConfig,
  validateOrganizationConfig,
  getDefaultConfig,
} from '../models/OrganizationConfig';

/**
 * Get organization configuration, or return defaults if not configured
 * @param orgId - Organization ID
 * @returns Organization config or default values
 */
export async function getConfig(
  orgId: string
): Promise<{ sectionALimit: number; sectionBLimit: number }> {
  if (!orgId) {
    return getDefaultConfig();
  }

  const db = await connectDB();
  const config = await db.collection('organizationConfigs').findOne({ orgId });

  if (!config) {
    // Return defaults without creating DB record
    return getDefaultConfig();
  }

  return {
    sectionALimit: config.sectionALimit || 45,
    sectionBLimit: config.sectionBLimit || 45,
  };
}

/**
 * Update organization configuration
 * Creates config if it doesn't exist, updates if it exists
 * @param orgId - Organization ID
 * @param limits - New limit values
 * @returns Updated configuration
 */
export async function updateConfig(
  orgId: string,
  limits: { sectionALimit: number; sectionBLimit: number }
): Promise<OrganizationConfig> {
  if (!orgId) {
    throw new Error('Organization ID is required');
  }

  const db = await connectDB();
  const now = new Date().toISOString();

  // Check if config exists
  const existing = await db.collection('organizationConfigs').findOne({ orgId });

  if (existing) {
    // Update existing config
    const updated = {
      ...existing,
      sectionALimit: limits.sectionALimit,
      sectionBLimit: limits.sectionBLimit,
      updatedAt: now,
    };

    const validated = validateOrganizationConfig(updated);
    await db.collection('organizationConfigs').updateOne(
      { orgId },
      {
        $set: {
          sectionALimit: validated.sectionALimit,
          sectionBLimit: validated.sectionBLimit,
          updatedAt: validated.updatedAt,
        },
      }
    );

    return validated;
  } else {
    // Create new config
    const newConfig = createOrganizationConfig(
      orgId,
      limits.sectionALimit,
      limits.sectionBLimit
    );

    const validated = validateOrganizationConfig(newConfig);
    // Remove _id before inserting - MongoDB will generate it
    const { _id, ...configToInsert } = validated;
    await db.collection('organizationConfigs').insertOne(configToInsert);

    // Fetch the inserted document to get the MongoDB-generated _id
    const inserted = await db.collection('organizationConfigs').findOne({ orgId });
    if (!inserted) {
      throw new Error('Failed to create organization configuration');
    }
    
    // Convert MongoDB document to OrganizationConfig format
    return {
      orgId: inserted.orgId as string,
      sectionALimit: inserted.sectionALimit as number,
      sectionBLimit: inserted.sectionBLimit as number,
      createdAt: inserted.createdAt as string,
      updatedAt: inserted.updatedAt as string,
      _id: inserted._id.toString(),
    };
  }
}

export const organizationConfigService = {
  getConfig,
  updateConfig,
  getDefaultConfig,
};
