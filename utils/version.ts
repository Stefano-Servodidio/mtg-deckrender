/**
 * Version utilities for release tracking and comparison
 */

const DISMISSED_RELEASES_KEY = 'mtg-deck-dismissed-releases'
const LAST_SEEN_VERSION_KEY = 'mtg-deck-last-seen-version'

/**
 * Compares two semantic versions (e.g., "v1.2.3")
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
    // Remove 'v' prefix if present
    const clean1 = v1.replace(/^v/, '')
    const clean2 = v2.replace(/^v/, '')

    const parts1 = clean1.split('.').map(Number)
    const parts2 = clean2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0
        const part2 = parts2[i] || 0

        if (part1 > part2) return 1
        if (part1 < part2) return -1
    }

    return 0
}

/**
 * Checks if a release has been dismissed by the user
 */
export function isReleaseDismissed(tagName: string): boolean {
    if (typeof window === 'undefined') return false

    try {
        const dismissed = localStorage.getItem(DISMISSED_RELEASES_KEY)
        if (!dismissed) return false

        const dismissedReleases: string[] = JSON.parse(dismissed)
        return dismissedReleases.includes(tagName)
    } catch {
        return false
    }
}

/**
 * Marks a release as dismissed
 */
export function dismissRelease(tagName: string): void {
    if (typeof window === 'undefined') return

    try {
        const dismissed = localStorage.getItem(DISMISSED_RELEASES_KEY)
        const dismissedReleases: string[] = dismissed
            ? JSON.parse(dismissed)
            : []

        if (!dismissedReleases.includes(tagName)) {
            dismissedReleases.push(tagName)
            localStorage.setItem(
                DISMISSED_RELEASES_KEY,
                JSON.stringify(dismissedReleases)
            )
        }
    } catch (error) {
        console.error('Failed to dismiss release:', error)
    }
}

/**
 * Gets the last version the user has seen
 */
export function getLastSeenVersion(): string | null {
    if (typeof window === 'undefined') return null

    try {
        return localStorage.getItem(LAST_SEEN_VERSION_KEY)
    } catch {
        return null
    }
}

/**
 * Updates the last seen version
 */
export function setLastSeenVersion(version: string): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(LAST_SEEN_VERSION_KEY, version)
    } catch (error) {
        console.error('Failed to set last seen version:', error)
    }
}

/**
 * Checks if there's a new release compared to the last seen version
 */
export function hasNewRelease(
    latestVersion: string,
    currentVersion: string
): boolean {
    const lastSeen = getLastSeenVersion()

    // If no version has been seen yet, check against current app version
    const compareAgainst = lastSeen || currentVersion

    return compareVersions(latestVersion, compareAgainst) > 0
}
