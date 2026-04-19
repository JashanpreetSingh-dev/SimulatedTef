import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
});

/**
 * Validates required configuration at process start.
 * Call immediately after `import 'dotenv/config'` in server.ts.
 */
export function assertServerEnv(): void {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const msg = result.error.flatten().fieldErrors;
    console.error('Invalid environment:', msg);
    console.error(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
    process.exit(1);
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    if (!process.env.CLERK_SECRET_KEY?.trim()) {
      console.error('CLERK_SECRET_KEY is required in production.');
      process.exit(1);
    }
    if (!process.env.FRONTEND_URL?.trim()) {
      console.error('FRONTEND_URL is required in production (CORS allowlist).');
      process.exit(1);
    }
  }
}

/** Origins allowed for CORS (browser requests with an Origin header). */
export function getCorsAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const add = (url?: string | null) => {
    const u = url?.trim();
    if (u) origins.add(u.replace(/\/$/, ''));
  };
  add(process.env.FRONTEND_URL);
  const extra = process.env.CORS_ORIGINS?.split(',') ?? [];
  for (const o of extra) add(o);
  if (process.env.NODE_ENV !== 'production') {
    add('http://localhost:3000');
    add('http://127.0.0.1:3000');
  }
  return origins;
}
