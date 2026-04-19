import type { Request, Response, NextFunction } from 'express';

const DEFAULT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 120_000;

/** SSE stays open for the whole speaking/written evaluation (often > 2 min); do not cap it. */
function isEvaluationProgressStream(req: Request): boolean {
  return req.method === 'GET' && /^\/api\/evaluations\/[^/]+\/stream$/u.test(req.path);
}

/**
 * Ends slow API requests so a hung handler does not hold the connection forever.
 * Webhook routes are mounted earlier in server.ts and never reach this middleware.
 */
export function requestTimeout(ms: number = DEFAULT_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isEvaluationProgressStream(req)) {
      return next();
    }
    const timer = setTimeout(() => {
      if (!res.writableEnded && !res.headersSent) {
        res.status(504).json({
          error: 'Request timeout',
          ...(req.requestId ? { requestId: req.requestId } : {}),
        });
      }
    }, ms);
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
}
