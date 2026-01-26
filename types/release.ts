/**
 * Release/Changelog types
 */

export interface Release {
    id: number
    tag_name: string
    name: string
    body: string
    created_at: string
    published_at: string
    html_url: string
    draft: boolean
    prerelease: boolean
}

export interface ReleaseApiResponse {
    releases: Release[]
    currentVersion: string
}
