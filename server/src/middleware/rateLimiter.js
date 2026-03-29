/**
 * In-memory rate limiter middleware.
 * Tracks attempts by IP address with a sliding window.
 * Suitable for single-server deployments.
 */

function createRateLimiter({ windowMs = 15 * 60 * 1000, maxAttempts = 5 } = {}) {
  const attempts = new Map();

  // Periodic cleanup of expired entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attempts.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        attempts.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Allow garbage collection if the process is shutting down
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiter(req, res, next) {
    const key = req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();

    let record = attempts.get(key);
    if (!record) {
      record = { timestamps: [] };
      attempts.set(key, record);
    }

    // Remove timestamps outside the window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxAttempts) {
      const oldestInWindow = record.timestamps[0];
      const retryAfterMs = windowMs - (now - oldestInWindow);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: `Too many attempts. Please try again in ${retryAfterSeconds} seconds.`,
      });
    }

    record.timestamps.push(now);
    return next();
  };
}

module.exports = { createRateLimiter };
