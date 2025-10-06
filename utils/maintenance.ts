import { NextResponse } from 'next/server'

/**
 * Checks if the application is in maintenance mode.
 * @returns {boolean} True if maintenance mode is enabled
 */
export function isMaintenanceMode(): boolean {
    return process.env.NEXT_PUBLIC_MAINTENANCE === 'true'
}

/**
 * Returns a 503 Service Unavailable response for API routes during maintenance.
 * @returns {NextResponse} 503 response with error message
 */
export function maintenanceResponse(): NextResponse {
    return NextResponse.json(
        { error: 'Service Unavailable - Maintenance mode' },
        { status: 503 }
    )
}
