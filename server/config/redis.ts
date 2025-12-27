/**
 * Redis connection configuration for BullMQ
 */

import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Create Redis connection for BullMQ
 */
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('Redis connection failed after 3 retries');
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000); // Exponential backoff
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Reconnect on READONLY error
    }
    return false;
  },
});

redis.on('connect', async () => {
  console.log('Connected to Redis');
  
  // Check eviction policy (BullMQ requires 'noeviction')
  try {
    const maxmemoryPolicy = await redis.config('GET', 'maxmemory-policy');
    const policy = maxmemoryPolicy[1];
    
    if (policy !== 'noeviction') {
      console.warn('WARNING: Redis eviction policy is set to:', policy);
      console.warn('BullMQ requires "noeviction" policy to prevent job data loss.');
      console.warn('For cloud Redis: Check your provider dashboard (Railway/Redis Cloud/Upstash)');
      console.warn('For local Redis: Run: redis-cli CONFIG SET maxmemory-policy noeviction');
      console.warn('See REDIS_CLOUD_SETUP.md for detailed instructions');
    } else {
      console.log('Redis eviction policy is correctly set to "noeviction"');
    }
  } catch (error) {
    // Ignore if config command fails (might not have permissions)
    console.warn('Could not check Redis eviction policy (may need admin permissions)');
  }
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
  if (!redisUrl.includes('localhost')) {
    console.error('Make sure Redis is running or REDIS_URL is set correctly');
  }
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

// Export connection object for BullMQ
export const connection = {
  host: redis.options.host || 'localhost',
  port: redis.options.port || 6379,
  ...(redis.options.password && { password: redis.options.password }),
};

