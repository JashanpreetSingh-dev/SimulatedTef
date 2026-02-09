/**
 * D2C Configuration Model - default limits for D2C users (Free tier baseline)
 */

import { z } from 'zod';

// Zod schema for D2C config validation
export const D2CConfigSchema = z.object({
  sectionALimit: z.number().min(0).default(1),
  sectionBLimit: z.number().min(0).default(1),
  writtenExpressionSectionALimit: z.number().min(0).default(1),
  writtenExpressionSectionBLimit: z.number().min(0).default(1),
  mockExamLimit: z.number().min(0).default(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type D2CConfig = z.infer<typeof D2CConfigSchema> & {
  _id?: string;
};

/**
 * Default D2C configuration (Free tier baseline)
 */
export function getDefaultD2CConfig(): Omit<D2CConfig, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    sectionALimit: 1,
    sectionBLimit: 1,
    writtenExpressionSectionALimit: 1, // Same as speaking
    writtenExpressionSectionBLimit: 1, // Same as speaking
    mockExamLimit: 1,
  };
}

/**
 * Validate D2C config data
 */
export function validateD2CConfig(data: unknown): D2CConfig {
  return D2CConfigSchema.parse(data);
}
