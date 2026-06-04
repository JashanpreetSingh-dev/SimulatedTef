/**
 * Redis connection configuration for BullMQ
 */

import { Redis } from 'ioredis';

function getRedisUrl(): string {
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      ...(parsed.password && { password: decodeURIComponent(parsed.password) }),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

// Derived from URL at call time — no Redis client created at import time
export const connection = new Proxy({} as ReturnType<typeof parseRedisUrl>, {
  get(_target, prop) {
    return parseRedisUrl(getRedisUrl())[prop as keyof ReturnType<typeof parseRedisUrl>];
  },
});

let _redis: Redis | undefined;

function createRedis(): Redis {
  const url = getRedisUrl();
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    reconnectOnError: (err) => {
      return err.message.includes('READONLY');
    },
  });

  client.on('connect', async () => {
    console.log('Connected to Redis');
    try {
      const maxmemoryPolicy = await client.config('GET', 'maxmemory-policy');
      const policy = maxmemoryPolicy[1];
      if (policy !== 'noeviction') {
        console.warn('WARNING: Redis eviction policy is set to:', policy);
        console.warn('BullMQ requires "noeviction" policy to prevent job data loss.');
      } else {
        console.log('Redis eviction policy is correctly set to "noeviction"');
      }
    } catch {
      // Ignore if config command fails (may not have admin permissions)
    }
  });

  client.on('error', (err) => {
    console.error('Redis error:', err.message);
    if (!url.includes('localhost')) {
      console.error('Make sure Redis is running or REDIS_URL is set correctly');
    }
  });

  client.on('close', () => {
    console.log('Redis connection closed');
  });

  return client;
}

export function getRedis(): Redis {
  if (!_redis) {
    _redis = createRedis();
  }
  return _redis;
}

// Lazy proxy so existing `import { redis }` callers work without change
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as any)[prop];
  },
});

