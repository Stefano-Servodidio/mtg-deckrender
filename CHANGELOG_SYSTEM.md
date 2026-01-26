# Changelog System Documentation

## Overview

This document describes the changelog system implemented for MTG DeckRender. The system provides a complete solution for displaying GitHub release notes on the website, with an announcement banner for new releases.

## Architecture

### Data Flow

1. **GitHub Releases** → Auto-generated release notes via GitHub Actions deploy workflow
2. **API Layer** (`/api/releases`) → Fetches and caches release data from GitHub API
3. **Frontend** (`/release-notes`) → Displays formatted changelogs
4. **Banner System** → Notifies users of new releases with persistent dismissal

### Components

#### 1. API Route: `/api/releases`

**File:** `app/api/releases/route.ts`

- Fetches releases from GitHub Releases API
- Filters out drafts and pre-releases
- Implements in-memory caching (1 hour)
- Returns releases with current app version
- Respects maintenance mode

**Response Format:**

```json
{
    "releases": [
        {
            "id": 279431307,
            "tag_name": "v1.0.0",
            "name": "Release v1.0.0",
            "body": "## What's Changed\n...",
            "created_at": "2026-01-23T16:21:45Z",
            "published_at": "2026-01-23T16:21:47Z",
            "html_url": "https://github.com/...",
            "draft": false,
            "prerelease": false
        }
    ],
    "currentVersion": "1.0.0"
}
```

#### 2. Release Notes Page: `/release-notes`

**File:** `app/release-notes/page.tsx`

- Client-side page that fetches from `/api/releases`
- Displays releases in reverse chronological order
- Formats markdown content (headers, lists, links, bold)
- Highlights latest release with blue background and "Latest" badge
- Links to GitHub for full details

**Features:**

- Loading state with spinner
- Error handling with alert
- Responsive design
- Clean, readable formatting
- Links to GitHub releases

#### 3. Announcement Banner System

**Files:**

- `components/AnnouncementBanner.tsx` (reusable)
- `components/NewReleaseBanner.tsx` (release-specific)

**AnnouncementBanner:**

- Reusable component for any announcement
- Dismissible with close button
- Optional action button
- Multiple color schemes (blue, green, yellow, red, purple)
- Fixed position at top of page
- Responsive design

**NewReleaseBanner:**

- Checks for new releases on mount
- Compares latest release with last seen version
- Shows banner only for new releases that haven't been dismissed
- Persistent dismissal via localStorage
- "View Release Notes" action button
- Purple color scheme for visibility

#### 4. Version Utilities

**File:** `utils/version.ts`

Functions:

- `compareVersions(v1, v2)` - Semantic version comparison
- `isReleaseDismissed(tagName)` - Check if user dismissed a release
- `dismissRelease(tagName)` - Mark release as dismissed
- `getLastSeenVersion()` - Get last version user viewed
- `setLastSeenVersion(version)` - Update last seen version
- `hasNewRelease(latest, current)` - Check for new releases

**LocalStorage Keys:**

- `mtg-deck-dismissed-releases` - Array of dismissed release tags
- `mtg-deck-last-seen-version` - Last version seen by user

#### 5. Types

**File:** `types/release.ts`

```typescript
interface Release {
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

interface ReleaseApiResponse {
    releases: Release[]
    currentVersion: string
}
```

### Integration Points

#### App Layout

**File:** `app/layout.tsx`

The `NewReleaseBanner` is integrated into the root layout:

```tsx
<Providers>
    <NewReleaseBanner />
    {children}
    <CookieBanner />
</Providers>
```

Position: Top of page, above all content

#### Navigation

**File:** `components/Navbar.tsx`

Added "Release Notes" link to navbar:

- Desktop: Ghost button with bell icon
- Mobile: Menu item
- Analytics tracking included

### User Experience Flow

1. **New Release Published:**
    - GitHub Actions creates release with auto-generated notes
    - Release appears in GitHub Releases

2. **User Visits Website:**
    - `NewReleaseBanner` checks `/api/releases`
    - Compares latest release with last seen version
    - If new release exists and not dismissed: show banner

3. **User Interactions:**
    - **Click "View Release Notes":** Navigate to `/release-notes`, mark version as seen
    - **Click close button:** Dismiss banner, mark release as dismissed
    - Banner won't show again for this release

4. **Release Notes Page:**
    - Shows all releases in chronological order
    - Latest release highlighted
    - Full changelog content with formatting
    - Links to GitHub for more details

### Caching Strategy

#### API Caching

- **In-memory:** 1 hour (3600 seconds)
- **HTTP Cache-Control:** `public, s-maxage=3600, stale-while-revalidate=7200`
- **Benefits:** Reduces GitHub API calls, faster response times

#### Client Caching

- **LocalStorage:** Dismissed releases and last seen version
- **Persistent:** Survives page refreshes and browser restarts
- **Scoped:** Per user/browser

### Error Handling

1. **API Failures:**
    - Returns 500 with error message
    - Provides empty releases array
    - Includes current version for fallback

2. **Frontend Errors:**
    - Loading states prevent empty screens
    - Error alerts inform users
    - Graceful degradation (no banner if API fails)

3. **Network Issues:**
    - Try-catch blocks prevent crashes
    - Console logging for debugging
    - User-friendly error messages

### Maintenance Mode

The `/api/releases` endpoint respects maintenance mode:

- Returns 503 when `NEXT_PUBLIC_MAINTENANCE=true`
- Consistent with other API routes
- Prevents unnecessary GitHub API calls during maintenance

## Configuration

### GitHub API

- **Repository:** `Stefano-Servodidio/mtg-deck-to-png`
- **Endpoint:** `https://api.github.com/repos/{owner}/{repo}/releases`
- **Filters:** Excludes drafts and pre-releases
- **Limit:** 10 most recent releases

### Environment Variables

- **Current Version:** Uses `process.env.npm_package_version` or defaults to `1.0.0`
- **Maintenance Mode:** `NEXT_PUBLIC_MAINTENANCE`

## Testing

### Unit Tests

All existing tests pass (475 tests). No new unit tests required as this is primarily UI/integration work.

### Manual Testing Checklist

- [ ] `/api/releases` returns proper JSON structure
- [ ] `/release-notes` page loads and displays releases
- [ ] Banner appears for new releases
- [ ] Banner can be dismissed
- [ ] Dismissal persists across page refreshes
- [ ] "View Release Notes" button navigates correctly
- [ ] Navbar link works on desktop and mobile
- [ ] Responsive design works on all screen sizes

### Production Testing

After deployment:

1. Check that releases are fetched from GitHub successfully
2. Verify caching is working (check response headers)
3. Test banner appears for new releases
4. Confirm localStorage persistence works

## Future Enhancements

Potential improvements:

1. Add RSS feed for releases
2. Email notifications for subscribed users
3. Filter releases by type (features, bugs, etc.)
4. Search functionality in release notes
5. Changelog comparison between versions
6. In-app changelog viewer (modal)

## Maintenance

### Adding New Release

1. Use GitHub Actions deploy workflow
2. Workflow automatically creates release with auto-generated notes
3. Frontend automatically picks up new release
4. Banner shows to users who haven't seen it

### Updating Banner Style

Edit `components/NewReleaseBanner.tsx`:

- Change `colorScheme` prop for different colors
- Modify message text
- Update action button label

### Changing Cache Duration

Edit `app/api/releases/route.ts`:

- Modify `CACHE_DURATION` constant (currently 3600 seconds)

## Troubleshooting

### Banner not showing

1. Check browser console for errors
2. Verify `/api/releases` returns data
3. Clear localStorage: `localStorage.clear()`
4. Check that release version is newer than last seen

### Releases not loading

1. Check GitHub API rate limits
2. Verify repository and endpoint URLs
3. Check network tab for API errors
4. Review server logs for detailed errors

### Formatting issues

1. Verify markdown syntax in GitHub release body
2. Check CSS in `app/release-notes/page.tsx`
3. Test different markdown patterns
