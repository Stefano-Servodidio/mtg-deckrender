import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE === 'true'
    const pathname = request.nextUrl.pathname

    // Skip middleware for site-down page and its assets
    if (pathname.startsWith('/site-down')) {
        return NextResponse.next()
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
