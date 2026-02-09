/**
 * Centralized request validation using Zod
 * Returns consistent 400 responses with error details
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

function validate(source: Source, schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (result.success) {
      (req as any)[`_validated_${source}`] = result.data;
      next();
      return;
    }
    const errors = result.error.flatten();
    const message = errors.formErrors?.[0] ?? errors.fieldErrors
      ? Object.entries(errors.fieldErrors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('; ')
      : 'Validation failed';
    res.status(400).json({
      error: message,
      details: process.env.NODE_ENV === 'development' ? errors : undefined,
    });
  };
}

/**
 * Validate req.body against a Zod schema. On failure returns 400 with error message.
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return validate('body', schema);
}

/**
 * Validate req.query against a Zod schema.
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return validate('query', schema);
}

/**
 * Validate req.params against a Zod schema.
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return validate('params', schema);
}

export { z };
