import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from './utils/rateLimit'
import { getClientIp, isSuspiciousUserAgent } from './utils/security'

export function middleware(request: NextRequest) {
    const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE === 'true'
    const pathname = request.nextUrl.pathname

    // Skip middleware for site-down page and its assets
    if (pathname.startsWith('/site-down')) {
        // If maintenance mode is enabled, allow access to site-down page
        if (isMaintenanceMode) {
            return NextResponse.next()
        }
        return NextResponse.redirect(new URL('/', request.url))
    }

    // If maintenance mode is enabled, redirect to site-down
    if (isMaintenanceMode) {
        // For API routes, return 503 instead of redirect
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Service Unavailable - Maintenance mode' },
                { status: 503 }
            )
        }

        // For all other routes, redirect to site-down
        return NextResponse.redirect(new URL('/site-down', request.url))
    }

    // Apply rate limiting and bot protection to API routes
    if (pathname.startsWith('/api/')) {
        const clientIp = getClientIp(request)
        const userAgent = request.headers.get('user-agent')

        // Check for suspicious bots (but allow legitimate ones)
        if (isSuspiciousUserAgent(userAgent)) {
            console.warn(
                `Suspicious user agent blocked: ${userAgent} from ${clientIp}`
            )
            return NextResponse.json(
                {
                    error: 'Forbidden',
                    message:
                        'Access denied. If you are a legitimate user, please use a standard web browser.'
                },
                { status: 403 }
            )
        }

        // Apply rate limiting (different limits for different endpoints)
        let maxRequests = 10 // Default: 10 requests per minute
        let windowMs = 60000 // 1 minute

        // More strict limits for expensive operations
        if (
            pathname.startsWith('/api/deck-png') ||
            pathname.startsWith('/api/collections')
        ) {
            maxRequests = 5 // 5 requests per minute for image generation
        }

        const rateLimitResult = checkRateLimit(clientIp, {
            windowMs,
            maxRequests
        })

        if (!rateLimitResult.allowed) {
            const retryAfter = Math.ceil(
                (rateLimitResult.resetTime - Date.now()) / 1000
            )
            return NextResponse.json(
                {
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': retryAfter.toString(),
                        'X-RateLimit-Limit': maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset':
                            rateLimitResult.resetTime.toString()
                    }
                }
            )
        }

        // Add rate limit headers to response
        const response = NextResponse.next()
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set(
            'X-RateLimit-Remaining',
            rateLimitResult.remaining.toString()
        )
        response.headers.set(
            'X-RateLimit-Reset',
            rateLimitResult.resetTime.toString()
        )

        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
}
