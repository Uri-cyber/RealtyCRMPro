/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis or a distributed solution
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
// Note: This works for single-instance deployments
// For multi-instance deployments, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
  lastCleanup = now;
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Timestamp when the rate limit resets */
  resetAt: number;
  /** Number of seconds until the rate limit resets */
  retryAfter: number;
}

/**
 * Default rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Strict rate limiting for authentication endpoints
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  register: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 registrations per hour
  forgotPassword: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  resetPassword: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 attempts per hour

  // Standard API rate limiting
  api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute

  // Bulk operations
  bulkSms: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 bulk SMS per hour
} as const;

/**
 * Checks if a request is allowed based on rate limiting rules
 *
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param endpoint - The endpoint being accessed (used as part of the key)
 * @param config - Rate limiting configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupExpiredEntries();

  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // If no entry exists or the window has expired, create a new entry
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
      retryAfter: 0,
    };
  }

  // Increment the count
  entry.count++;

  // Check if rate limit is exceeded
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    retryAfter: 0,
  };
}

/**
 * Gets the client IP address from the request
 * Handles various proxy headers
 */
export function getClientIp(request: Request): string {
  // Check various headers in order of preference
  const headers = request.headers;

  // X-Forwarded-For (most common, may contain multiple IPs)
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Get the first IP (client's original IP)
    return xForwardedFor.split(',')[0].trim();
  }

  // X-Real-IP (used by Nginx)
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }

  // CF-Connecting-IP (Cloudflare)
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // True-Client-IP (Akamai, Cloudflare Enterprise)
  const trueClientIp = headers.get('true-client-ip');
  if (trueClientIp) {
    return trueClientIp.trim();
  }

  // Fallback to a default value for localhost/development
  return 'unknown';
}

/**
 * Resets the rate limit for a specific identifier and endpoint
 * Useful for testing or when a user successfully authenticates
 */
export function resetRateLimit(identifier: string, endpoint: string): void {
  const key = `${endpoint}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Creates rate limit headers to include in the response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.remaining.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    ...(result.retryAfter > 0 && { 'Retry-After': result.retryAfter.toString() }),
  };
}
