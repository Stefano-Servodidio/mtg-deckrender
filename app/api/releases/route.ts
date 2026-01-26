import { NextResponse } from 'next/server'
import type { Release, ReleaseApiResponse } from '@/types/release'
import { isMaintenanceMode, maintenanceResponse } from '@/utils/maintenance'
import packageJson from '@/package.json'

const GITHUB_OWNER = 'Stefano-Servodidio'
const GITHUB_REPO = 'mtg-deck-to-png'
const CACHE_DURATION = 60 * 60 // 1 hour in seconds

// In-memory cache
let cachedData: { data: ReleaseApiResponse; timestamp: number } | null = null

/**
 * Fetches releases from GitHub API
 */
async function fetchGitHubReleases(): Promise<Release[]> {
    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases?per_page=10`,
        {
            headers: {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            next: { revalidate: CACHE_DURATION }
        }
    )

    if (!response.ok) {
        throw new Error(
            `GitHub API error: ${response.status} ${response.statusText}`
        )
    }

    const releases = await response.json()

    // Filter out drafts and pre-releases by default
    return releases
        .filter((r: Release) => !r.draft && !r.prerelease)
        .map((r: Release) => ({
            id: r.id,
            tag_name: r.tag_name,
            name: r.name,
            body: r.body,
            created_at: r.created_at,
            published_at: r.published_at,
            html_url: r.html_url,
            draft: r.draft,
            prerelease: r.prerelease
        }))
}

/**
 * Gets the current app version from package.json
 */
function getCurrentVersion(): string {
    return packageJson.version
}

/**
 * GET /api/releases
 * Returns list of releases and current app version
 */
export async function GET() {
    // Check maintenance mode
    if (isMaintenanceMode()) {
        return maintenanceResponse()
    }

    try {
        // Check cache
        const now = Date.now()
        if (cachedData && now - cachedData.timestamp < CACHE_DURATION * 1000) {
            return NextResponse.json(cachedData.data)
        }

        // Fetch fresh data
        const releases = await fetchGitHubReleases()
        const currentVersion = getCurrentVersion()

        const data: ReleaseApiResponse = {
            releases,
            currentVersion
        }

        // Update cache
        cachedData = { data, timestamp: now }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`
            }
        })
    } catch (error) {
        console.error('Error fetching releases:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch releases',
                releases: [],
                currentVersion: getCurrentVersion()
            },
            { status: 500 }
        )
    }
}
