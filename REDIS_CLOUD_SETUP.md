# Redis Cloud Setup Guide

## Setting Eviction Policy for Cloud Redis

BullMQ requires Redis to have `noeviction` policy to prevent job data from being evicted. Here's how to set it for common cloud Redis providers:

### Railway Redis

1. Go to your Railway dashboard
2. Select your Redis service
3. Click on **"Variables"** or **"Settings"**
4. Look for **"Eviction Policy"** or **"maxmemory-policy"** setting
5. Set it to: `noeviction`
6. Save and restart the Redis service

**Note:** Railway Redis may not expose this setting directly. If unavailable, the default might already be `noeviction`. Check the warning message when your app starts.

### Redis Cloud (redis.com)

1. Log in to [Redis Cloud Dashboard](https://app.redislabs.com/)
2. Select your database/subscription
3. Go to **"Configuration"** or **"Settings"**
4. Find **"Eviction Policy"** or **"maxmemory-policy"**
5. Set to: `noeviction`
6. Save changes

### Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Select your Redis database
3. Go to **"Settings"** tab
4. Find **"Eviction Policy"** or **"Eviction"** setting
5. Set to: `noeviction`
6. Save changes

### AWS ElastiCache

1. Go to AWS ElastiCache Console
2. Select your Redis cluster
3. Go to **"Parameter Groups"**
4. Create or edit a parameter group
5. Set `maxmemory-policy` to: `noeviction`
6. Apply the parameter group to your cluster

### Azure Cache for Redis

1. Go to Azure Portal
2. Select your Redis Cache resource
3. Go to **"Advanced settings"** or **"Configuration"**
4. Find **"maxmemory-policy"**
5. Set to: `noeviction`
6. Save changes

### Google Cloud Memorystore

1. Go to Google Cloud Console
2. Select your Redis instance
3. Go to **"Configuration"**
4. Edit configuration
5. Set **"maxmemory-policy"** to: `noeviction`
6. Save and apply

## Verify the Policy

After setting the policy, restart your application. The code will automatically check and display:

- ✅ **Success:** `Redis eviction policy is correctly set to "noeviction"`
- ⚠️ **Warning:** If policy is incorrect, you'll see a warning with instructions

## Alternative: Check via Redis CLI

If your cloud provider gives you Redis CLI access:

```bash
redis-cli -h <your-redis-host> -p <port> -a <password> CONFIG GET maxmemory-policy
```

Should return: `maxmemory-policy noeviction`

## Important Notes

- **Data Safety:** Without `noeviction`, Redis may delete job data when memory is full, causing job failures
- **Memory Management:** With `noeviction`, Redis will return errors when memory is full instead of deleting data
- **Monitoring:** Monitor your Redis memory usage to ensure you have enough capacity
- **Railway:** If using Railway Redis plugin, check if eviction policy is configurable in the plugin settings

## "not enough memory" (Lua script errors)

If you see **`ERR Error running script ... not enough memory`** from Bull/BullMQ (evaluation or question-generation workers), Redis is out of memory when running queue scripts.

**Fix:**

1. **Increase Redis memory**
   - **Local Redis:**  
     `redis-cli CONFIG SET maxmemory 256mb`  
     (or higher, e.g. `512mb` if you run many jobs.)
   - **Cloud (Railway / Redis Cloud / Upstash):** In the dashboard, raise the memory/cache size for the Redis instance (e.g. 256 MB or more).
2. **Restart Redis** after changing `maxmemory` if your setup requires it.
3. **Optional:** Clear old Bull keys if you don’t need history:  
   `redis-cli KEYS "bull:*"` then delete completed/failed queues you no longer need.

**Why:** Bull/BullMQ use Lua scripts for job moves. If Redis is near its limit or `maxmemory` is very low, script execution can fail with "not enough memory".

## Switching Redis URL (e.g. to local Docker)

When you change `REDIS_URL` (e.g. from cloud to local Docker), the app connects to a **new** Redis instance. That new instance is empty:

- **Old failed jobs** stay on the old Redis; the app no longer sees them. You don’t need to do anything about them.
- **New evaluations** run on the new Redis. If you still see a “failed” message in the UI, it’s from a previous session (old job ID); refresh or start a new evaluation.

To clear failed (and old completed) jobs on the **current** Redis (e.g. after fixing memory and wanting a clean queue), run:

```bash
npm run clear-failed-jobs
```

---

## If Policy Cannot Be Changed

Some managed Redis services don't allow changing the eviction policy. In that case:

1. **Monitor memory usage** closely
2. **Set appropriate `maxmemory`** limits
3. **Use Redis persistence** (RDB/AOF) to recover from issues
4. **Consider upgrading** to a plan that allows policy configuration
5. **Use a different Redis provider** that supports `noeviction` policy

