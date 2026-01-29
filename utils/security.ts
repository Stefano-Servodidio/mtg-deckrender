/**
 * Security utilities for bot detection and request validation
 */

import { NextRequest } from 'next/server'

/**
 * Common bot/crawler user agents to block or limit
 */
const SUSPICIOUS_USER_AGENTS = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python-requests',
    'java/',
    'go-http-client',
    'axios/',
    'node-fetch',
    'undefined' // Missing user agent
]

/**
 * Allowed automation user agents (legitimate services)
 */
const ALLOWED_BOTS = [
    'googlebot',
    'bingbot',
    'slackbot',
    'twitterbot',
    'facebookexternalhit',
    'linkedinbot',
    'discordbot'
]

/**
 * Check if a user agent appears to be a bot
 * @param userAgent - The User-Agent header string
 * @returns true if the user agent appears suspicious
 */
export function isSuspiciousUserAgent(userAgent: string | null): boolean {
    if (!userAgent) return true

    const lowerUA = userAgent.toLowerCase()

    // Allow legitimate bots
    if (ALLOWED_BOTS.some((bot) => lowerUA.includes(bot))) {
        return false
    }

    // Check for suspicious patterns
    return SUSPICIOUS_USER_AGENTS.some((pattern) => lowerUA.includes(pattern))
}

/**
 * Extract client IP address from request
 * Handles proxies and load balancers
 */
export function getClientIp(request: NextRequest): string {
    // Check for common proxy headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim()
    }

    const realIp = request.headers.get('x-real-ip')
    if (realIp) {
        return realIp
    }

    // Fallback to a default value for unknown IPs
    return 'unknown'
}

/**
 * Validate that request body size is within acceptable limits
 * @param contentLength - Content-Length header value
 * @param maxSize - Maximum allowed size in bytes (default: 1MB)
 */
export function validateRequestSize(
    contentLength: string | null,
    maxSize: number = 1024 * 1024 // 1MB
): { valid: boolean; message?: string } {
    if (!contentLength) {
        return { valid: true }
    }

    const size = parseInt(contentLength, 10)
    if (isNaN(size)) {
        return { valid: true }
    }

    if (size > maxSize) {
        return {
            valid: false,
            message: `Request body too large. Maximum size is ${maxSize} bytes.`
        }
    }

    return { valid: true }
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 * @param input - Raw string input
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove HTML brackets
        .replace(/['"]/g, '') // Remove quotes
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
}

/**
 * Validate decklist input for reasonable size and content
 */
export function validateDecklistInput(decklist: string): {
    valid: boolean
    message?: string
} {
    // Check if empty
    if (!decklist || decklist.trim().length === 0) {
        return { valid: false, message: 'Decklist cannot be empty.' }
    }

    // Check maximum length (prevent DoS via large input)
    const maxLength = 50000 // ~50KB of text
    if (decklist.length > maxLength) {
        return {
            valid: false,
            message: `Decklist is too long. Maximum ${maxLength} characters allowed.`
        }
    }

    // Check for excessive line count
    const lines = decklist.split('\n')
    if (lines.length > 500) {
        return {
            valid: false,
            message: 'Decklist has too many lines. Maximum 500 lines allowed.'
        }
    }

    return { valid: true }
}
