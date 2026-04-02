/**
 * Rate limiting middleware
 * Uses express-rate-limit to prevent API abuse
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

/**
 * Custom key generator that uses userId if available, otherwise uses IP with IPv6 support
 */
const keyGenerator = (req: Request): string => {
  // If user is authenticated, use userId
  if ((req as any).userId) {
    return String((req as any).userId);
  }
  // Otherwise, use IP with proper IPv6 handling
  return ipKeyGenerator(req as any);
};

/**
 * General API rate limiter - applied to all /api routes.
 * Keys by IP (auth runs per-route, so userId not set at this layer).
 * Limit: 200 requests per minute per IP.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req as any),
});

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
 * Limit: 60 requests per minute per user
 */
export const resultRetrievalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per window
  message: 'Too many result retrieval requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

/** AI deck generation — limit cost per user */
export const dailyRitualDeckLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many daily ritual deck requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const dailyRitualWeakCardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});
