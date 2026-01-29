/**
 * Simple in-memory rate limiter for API endpoints
 * Tracks requests by IP address and enforces rate limits
 */

interface RateLimitEntry {
    count: number
    resetTime: number
}

// Store rate limit data in memory (resets on server restart)
const rateLimitMap = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
    /**
     * Time window in milliseconds
     * @default 60000 (1 minute)
     */
    windowMs?: number
    /**
     * Maximum number of requests per window
     * @default 10
     */
    maxRequests?: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param options - Rate limit configuration
 * @returns Object with allowed status and retry information
 */
export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = {}
): {
    allowed: boolean
    remaining: number
    resetTime: number
} {
    const { windowMs = 60000, maxRequests = 10 } = options

    const now = Date.now()
    const entry = rateLimitMap.get(identifier)

    // If no entry exists or window has expired, create new entry
    if (!entry || now > entry.resetTime) {
        const resetTime = now + windowMs
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime
        })

        return {
            allowed: true,
            remaining: maxRequests - 1,
            resetTime
        }
    }

    // Check if limit is exceeded
    if (entry.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime
        }
    }

    // Increment count
    entry.count++
    rateLimitMap.set(identifier, entry)

    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetTime: entry.resetTime
    }
}

/**
 * Clean up expired rate limit entries (should be called periodically)
 */
export function cleanupRateLimitMap(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    rateLimitMap.forEach((entry, key) => {
        if (now > entry.resetTime) {
            keysToDelete.push(key)
        }
    })

    keysToDelete.forEach((key) => rateLimitMap.delete(key))
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimitMap, 5 * 60 * 1000)
}
