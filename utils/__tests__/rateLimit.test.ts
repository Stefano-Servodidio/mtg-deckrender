import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { checkRateLimit, cleanupRateLimitMap } from '../rateLimit'

describe('rateLimit', () => {
    beforeEach(() => {
        // Clear rate limit map before each test
        cleanupRateLimitMap()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('checkRateLimit', () => {
        it('should allow first request', () => {
            const result = checkRateLimit('test-ip')

            expect(result.allowed).toBe(true)
            expect(result.remaining).toBe(9) // Default is 10 requests
        })

        it('should track multiple requests', () => {
            const ip = 'test-ip-2'

            for (let i = 0; i < 5; i++) {
                const result = checkRateLimit(ip)
                expect(result.allowed).toBe(true)
                expect(result.remaining).toBe(9 - i)
            }
        })

        it('should block requests when limit is exceeded', () => {
            const ip = 'test-ip-3'
            const maxRequests = 3

            // Make 3 allowed requests
            for (let i = 0; i < maxRequests; i++) {
                const result = checkRateLimit(ip, { maxRequests })
                expect(result.allowed).toBe(true)
            }

            // 4th request should be blocked
            const result = checkRateLimit(ip, { maxRequests })
            expect(result.allowed).toBe(false)
            expect(result.remaining).toBe(0)
        })

        it('should reset after time window expires', () => {
            vi.useFakeTimers()
            const ip = 'test-ip-4'
            const windowMs = 1000 // 1 second

            // First request
            let result = checkRateLimit(ip, { windowMs, maxRequests: 2 })
            expect(result.allowed).toBe(true)

            // Second request
            result = checkRateLimit(ip, { windowMs, maxRequests: 2 })
            expect(result.allowed).toBe(true)

            // Third request should be blocked
            result = checkRateLimit(ip, { windowMs, maxRequests: 2 })
            expect(result.allowed).toBe(false)

            // Advance time past window
            vi.advanceTimersByTime(1001)

            // Should be allowed again
            result = checkRateLimit(ip, { windowMs, maxRequests: 2 })
            expect(result.allowed).toBe(true)
        })

        it('should handle different IPs independently', () => {
            const ip1 = 'test-ip-5'
            const ip2 = 'test-ip-6'

            const result1 = checkRateLimit(ip1)
            const result2 = checkRateLimit(ip2)

            expect(result1.allowed).toBe(true)
            expect(result2.allowed).toBe(true)
            expect(result1.remaining).toBe(9)
            expect(result2.remaining).toBe(9)
        })

        it('should return resetTime', () => {
            const result = checkRateLimit('test-ip-7')

            expect(result.resetTime).toBeGreaterThan(Date.now())
            expect(result.resetTime).toBeLessThanOrEqual(Date.now() + 60000)
        })
    })

    describe('cleanupRateLimitMap', () => {
        it('should remove expired entries', () => {
            vi.useFakeTimers()
            const ip = 'test-ip-8'

            // Create an entry
            checkRateLimit(ip, { windowMs: 1000 })

            // Advance time past expiration
            vi.advanceTimersByTime(1001)

            // Clean up
            cleanupRateLimitMap()

            // New request should start fresh
            const result = checkRateLimit(ip)
            expect(result.remaining).toBe(9) // Back to max - 1
        })
    })
})
