'use client'

/**
 * Google Analytics 4 Component
 * Handles GA4 script injection and initialization
 */

import { useEffect, Suspense } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { initGA, trackPageView } from '@/utils/analytics'

function GoogleAnalyticsContent() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const gaId = process.env.NEXT_PUBLIC_GA_ID

    // Track page views on route change
    useEffect(() => {
        if (!gaId) return

        const url =
            pathname +
            (searchParams?.toString() ? `?${searchParams.toString()}` : '')
        trackPageView(url)
    }, [pathname, searchParams, gaId])

    return null
}

export function GoogleAnalytics() {
    const gaId = process.env.NEXT_PUBLIC_GA_ID

    // Don't render if GA ID is not set
    if (!gaId) {
        return null
    }

    return (
        <>
            {/* Google Analytics Script */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                onLoad={() => {
                    initGA(gaId)
                }}
            />
            <Suspense fallback={null}>
                <GoogleAnalyticsContent />
            </Suspense>
        </>
    )
}
