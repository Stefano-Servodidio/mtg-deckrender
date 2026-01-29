import { describe, it, expect } from 'vitest'
import {
    isSuspiciousUserAgent,
    validateRequestSize,
    sanitizeInput,
    validateDecklistInput
} from '../security'

describe('security', () => {
    describe('isSuspiciousUserAgent', () => {
        it('should block suspicious bots', () => {
            const suspiciousAgents = [
                'curl/7.64.1',
                'python-requests/2.25.1',
                'Mozilla/5.0 bot',
                'wget/1.20.3',
                'axios/0.21.1',
                null,
                ''
            ]

            suspiciousAgents.forEach((agent) => {
                expect(isSuspiciousUserAgent(agent)).toBe(true)
            })
        })

        it('should allow legitimate bots', () => {
            const legitimateBots = [
                'Mozilla/5.0 (compatible; Googlebot/2.1)',
                'Mozilla/5.0 (compatible; bingbot/2.0)',
                'Slackbot-LinkExpanding 1.0',
                'Twitterbot/1.0',
                'facebookexternalhit/1.1'
            ]

            legitimateBots.forEach((agent) => {
                expect(isSuspiciousUserAgent(agent)).toBe(false)
            })
        })

        it('should allow normal browsers', () => {
            const normalBrowsers = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
                'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0'
            ]

            normalBrowsers.forEach((agent) => {
                expect(isSuspiciousUserAgent(agent)).toBe(false)
            })
        })
    })

    describe('validateRequestSize', () => {
        it('should allow requests within size limit', () => {
            const result = validateRequestSize('1024', 2048)
            expect(result.valid).toBe(true)
        })

        it('should reject requests exceeding size limit', () => {
            const result = validateRequestSize('2048', 1024)
            expect(result.valid).toBe(false)
            expect(result.message).toContain('too large')
        })

        it('should allow requests with no content-length', () => {
            const result = validateRequestSize(null)
            expect(result.valid).toBe(true)
        })

        it('should handle invalid content-length', () => {
            const result = validateRequestSize('invalid')
            expect(result.valid).toBe(true)
        })
    })

    describe('sanitizeInput', () => {
        it('should remove HTML tags', () => {
            const input = '<script>alert("xss")</script>'
            const result = sanitizeInput(input)
            expect(result).not.toContain('<')
            expect(result).not.toContain('>')
        })

        it('should remove quotes', () => {
            const input = 'SELECT * FROM "users"'
            const result = sanitizeInput(input)
            expect(result).not.toContain('"')
        })

        it('should remove javascript protocol', () => {
            const input = 'javascript:alert(1)'
            const result = sanitizeInput(input)
            expect(result.toLowerCase()).not.toContain('javascript:')
        })

        it('should remove event handlers', () => {
            const input = 'onclick=alert(1)'
            const result = sanitizeInput(input)
            expect(result.toLowerCase()).not.toContain('onclick=')
        })

        it('should trim whitespace', () => {
            const input = '  test  '
            const result = sanitizeInput(input)
            expect(result).toBe('test')
        })
    })

    describe('validateDecklistInput', () => {
        it('should accept valid decklist', () => {
            const decklist = '4 Lightning Bolt\n4 Counterspell\n4 Brainstorm'
            const result = validateDecklistInput(decklist)
            expect(result.valid).toBe(true)
        })

        it('should reject empty decklist', () => {
            const result = validateDecklistInput('')
            expect(result.valid).toBe(false)
            expect(result.message).toContain('empty')
        })

        it('should reject decklist exceeding max length', () => {
            const decklist = 'a'.repeat(60000)
            const result = validateDecklistInput(decklist)
            expect(result.valid).toBe(false)
            expect(result.message).toContain('too long')
        })

        it('should reject decklist with too many lines', () => {
            const decklist = Array(600)
                .fill('1 Card')
                .join('\n')
            const result = validateDecklistInput(decklist)
            expect(result.valid).toBe(false)
            expect(result.message).toContain('too many lines')
        })

        it('should accept decklist at the line limit', () => {
            const decklist = Array(500)
                .fill('1 Card')
                .join('\n')
            const result = validateDecklistInput(decklist)
            expect(result.valid).toBe(true)
        })
    })
})
