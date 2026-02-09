/**
 * D2C Config Service - manages D2C default configuration for usage limits (Free tier baseline)
 */

import { connectDB } from '../db/connection';
import {
  D2CConfig,
  getDefaultD2CConfig,
  validateD2CConfig,
} from '../models/D2CConfig';

const D2C_CONFIG_ID = 'default'; // Single global D2C config

/** Document shape in d2cConfigs collection (we use string _id, not ObjectId) */
interface D2CConfigDoc {
  _id: string;
  sectionALimit: number;
  sectionBLimit: number;
  writtenExpressionSectionALimit: number;
  writtenExpressionSectionBLimit: number;
  mockExamLimit: number;
  createdAt?: string;
  updatedAt?: string;
}

function getD2CConfigCollection() {
  return connectDB().then((db) => db.collection<D2CConfigDoc>('d2cConfigs'));
}

/**
 * Get D2C configuration, or return defaults if not configured
 * @returns D2C config or default values
 */
export async function getConfig(): Promise<{
  sectionALimit: number;
  sectionBLimit: number;
  writtenExpressionSectionALimit: number;
  writtenExpressionSectionBLimit: number;
  mockExamLimit: number;
}> {
  const coll = await getD2CConfigCollection();
  const config = await coll.findOne({ _id: D2C_CONFIG_ID });

  if (!config) {
    // Return defaults without creating DB record (assert: getDefaultD2CConfig() satisfies this shape at runtime)
    const defaults = getDefaultD2CConfig();
    return {
      sectionALimit: defaults.sectionALimit ?? 1,
      sectionBLimit: defaults.sectionBLimit ?? 1,
      writtenExpressionSectionALimit: defaults.writtenExpressionSectionALimit ?? 1,
      writtenExpressionSectionBLimit: defaults.writtenExpressionSectionBLimit ?? 1,
      mockExamLimit: defaults.mockExamLimit ?? 1,
    };
  }

  return {
    sectionALimit: config.sectionALimit ?? 1,
    sectionBLimit: config.sectionBLimit ?? 1,
    writtenExpressionSectionALimit: config.writtenExpressionSectionALimit ?? 1,
    writtenExpressionSectionBLimit: config.writtenExpressionSectionBLimit ?? 1,
    mockExamLimit: config.mockExamLimit ?? 1,
  };
}

/**
 * Update D2C configuration
 * Creates config if it doesn't exist, updates if it exists
 * @param limits - New limit values
 * @returns Updated configuration
 */
export async function updateConfig(
  limits: {
    sectionALimit: number;
    sectionBLimit: number;
    writtenExpressionSectionALimit: number;
    writtenExpressionSectionBLimit: number;
    mockExamLimit: number;
  }
): Promise<D2CConfig> {
  const coll = await getD2CConfigCollection();
  const now = new Date().toISOString();

  // Check if config exists
  const existing = await coll.findOne({ _id: D2C_CONFIG_ID });

  if (existing) {
    // Update existing config
    const updated = {
      ...existing,
      sectionALimit: limits.sectionALimit,
      sectionBLimit: limits.sectionBLimit,
      writtenExpressionSectionALimit: limits.writtenExpressionSectionALimit,
      writtenExpressionSectionBLimit: limits.writtenExpressionSectionBLimit,
      mockExamLimit: limits.mockExamLimit,
      updatedAt: now,
    };

    const validated = validateD2CConfig(updated);
    await coll.updateOne(
      { _id: D2C_CONFIG_ID },
      {
        $set: {
          sectionALimit: validated.sectionALimit,
          sectionBLimit: validated.sectionBLimit,
          writtenExpressionSectionALimit: validated.writtenExpressionSectionALimit,
          writtenExpressionSectionBLimit: validated.writtenExpressionSectionBLimit,
          mockExamLimit: validated.mockExamLimit,
          updatedAt: validated.updatedAt,
        },
      }
    );

    return validated;
  } else {
    // Create new config
    const newConfig: D2CConfig = {
      _id: D2C_CONFIG_ID,
      ...getDefaultD2CConfig(),
      ...limits,
      createdAt: now,
      updatedAt: now,
    };

    const validated = validateD2CConfig(newConfig);
    const { _id, ...configToInsert } = validated;
    const toInsert: D2CConfigDoc = {
      _id: D2C_CONFIG_ID,
      sectionALimit: configToInsert.sectionALimit ?? 1,
      sectionBLimit: configToInsert.sectionBLimit ?? 1,
      writtenExpressionSectionALimit: configToInsert.writtenExpressionSectionALimit ?? 1,
      writtenExpressionSectionBLimit: configToInsert.writtenExpressionSectionBLimit ?? 1,
      mockExamLimit: configToInsert.mockExamLimit ?? 1,
    };
    await coll.insertOne(toInsert);

    // Fetch the inserted document
    const inserted = await coll.findOne({ _id: D2C_CONFIG_ID });
    if (!inserted) {
      throw new Error('Failed to create D2C configuration');
    }
    
    // Convert MongoDB document to D2CConfig format
    return {
      sectionALimit: inserted.sectionALimit as number,
      sectionBLimit: inserted.sectionBLimit as number,
      writtenExpressionSectionALimit: inserted.writtenExpressionSectionALimit as number,
      writtenExpressionSectionBLimit: inserted.writtenExpressionSectionBLimit as number,
      mockExamLimit: inserted.mockExamLimit as number,
      createdAt: inserted.createdAt as string,
      updatedAt: inserted.updatedAt as string,
      _id: inserted._id,
    };
  }
}

/**
 * Ensure default D2C config exists in DB (for fresh DB / server start).
 * Idempotent: no-op if config already exists.
 */
export async function ensureDefaultConfig(): Promise<void> {
  const coll = await getD2CConfigCollection();
  const existing = await coll.findOne({ _id: D2C_CONFIG_ID });
  if (existing) return;
  const now = new Date().toISOString();
  const defaults = getDefaultD2CConfig();
  const toInsert: D2CConfigDoc = {
    _id: D2C_CONFIG_ID,
    sectionALimit: defaults.sectionALimit ?? 1,
    sectionBLimit: defaults.sectionBLimit ?? 1,
    writtenExpressionSectionALimit: defaults.writtenExpressionSectionALimit ?? 1,
    writtenExpressionSectionBLimit: defaults.writtenExpressionSectionBLimit ?? 1,
    mockExamLimit: defaults.mockExamLimit ?? 1,
    createdAt: now,
    updatedAt: now,
  };
  await coll.insertOne(toInsert);
}

export const d2cConfigService = {
  getConfig,
  updateConfig,
  getDefaultD2CConfig,
  ensureDefaultConfig,
};
