interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Clean up old keys periodically
 */
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((record, key) => {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  });
}, 60000);

/**
 * Simple in-memory sliding window rate limiter
 */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60000
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return { success: true, remaining: limit - 1, resetAt: newRecord.resetAt };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, resetAt: record.resetAt };
}
