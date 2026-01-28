/**
 * Organization Configuration model - stores per-organization limits for Section A and Section B
 */

import { z } from 'zod';

// Zod schema for OrganizationConfig validation
export const OrganizationConfigSchema = z.object({
  orgId: z.string().min(1),
  sectionALimit: z.number().min(1).default(45),
  sectionBLimit: z.number().min(1).default(45),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OrganizationConfig = z.infer<typeof OrganizationConfigSchema> & {
  _id?: string;
};

/**
 * Validate OrganizationConfig data
 */
export function validateOrganizationConfig(data: unknown): OrganizationConfig {
  return OrganizationConfigSchema.parse(data);
}

/**
 * Create a new OrganizationConfig
 */
export function createOrganizationConfig(
  orgId: string,
  sectionALimit: number = 45,
  sectionBLimit: number = 45
): OrganizationConfig {
  const now = new Date().toISOString();
  return {
    orgId,
    sectionALimit,
    sectionBLimit,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get default configuration values
 */
export function getDefaultConfig(): { sectionALimit: number; sectionBLimit: number } {
  return {
    sectionALimit: 45,
    sectionBLimit: 45,
  };
}
