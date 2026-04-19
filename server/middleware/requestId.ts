import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Propagates or assigns `X-Request-Id` for correlation across logs and errors.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const fromHeader = typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'].trim() : '';
  const id = fromHeader || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
