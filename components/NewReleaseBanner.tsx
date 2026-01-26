'use client'

/**
 * New Release Banner Component
 * Shows a banner when a new release is available
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnnouncementBanner } from './AnnouncementBanner'
import type { ReleaseApiResponse } from '@/types/release'
import {
    dismissRelease,
    isReleaseDismissed,
    hasNewRelease,
    setLastSeenVersion
} from '@/utils/version'

export function NewReleaseBanner() {
    const [latestRelease, setLatestRelease] = useState<{
        tagName: string
        name: string
    } | null>(null)
    const [showBanner, setShowBanner] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function checkForNewRelease() {
            try {
                const response = await fetch('/api/releases')
                if (!response.ok) return

                const data: ReleaseApiResponse = await response.json()

                if (!data.releases || data.releases.length === 0) return

                const latest = data.releases[0]
                const currentVersion = data.currentVersion

                // Check if there's a new release and it hasn't been dismissed
                if (
                    hasNewRelease(latest.tag_name, currentVersion) &&
                    !isReleaseDismissed(latest.tag_name)
                ) {
                    setLatestRelease({
                        tagName: latest.tag_name,
                        name: latest.name
                    })
                    setShowBanner(true)
                }
            } catch (error) {
                console.error('Failed to check for new releases:', error)
            }
        }

        checkForNewRelease()
    }, [])

    const markVersionAsSeen = () => {
        if (latestRelease) {
            setLastSeenVersion(latestRelease.tagName)
        }
    }

    const handleDismiss = () => {
        if (latestRelease) {
            dismissRelease(latestRelease.tagName)
        }
        markVersionAsSeen()
        setShowBanner(false)
    }

    const handleViewReleaseNotes = () => {
        markVersionAsSeen()
        router.push('/release-notes')
    }

    if (!latestRelease) return null

    return (
        <AnnouncementBanner
            isVisible={showBanner}
            onDismiss={handleDismiss}
            colorScheme="purple"
            actionButton={{
                label: 'View Release Notes',
                onClick: handleViewReleaseNotes
            }}
        >
            <strong>New Release Available!</strong> {latestRelease.name} is now
            live with new features and improvements.
        </AnnouncementBanner>
    )
}
