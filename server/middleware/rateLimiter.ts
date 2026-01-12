/**
 * Rate limiting middleware
 * Uses express-rate-limit to prevent API abuse
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

/**
 * Custom key generator that uses userId if available, otherwise uses IP with IPv6 support
 */
const keyGenerator = (req: Request) => {
  // If user is authenticated, use userId
  if ((req as any).userId) {
    return (req as any).userId;
  }
  // Otherwise, use IP with proper IPv6 handling
  return ipKeyGenerator(req);
};

/**
 * Rate limiter for task selection endpoints
 * Limit: 10 requests per minute per user
 */
export const taskSelectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: 'Too many task selection requests. Please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator,
});

/**
 * Rate limiter for MCQ submission endpoints
 * Limit: 5 requests per minute per user
 */
export const mcqSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  message: 'Too many MCQ submission requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

/**
 * Rate limiter for result retrieval endpoints
 * Limit: 20 requests per minute per user
 */
export const resultRetrievalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per window
  message: 'Too many result retrieval requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});
