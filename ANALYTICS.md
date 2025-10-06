# Google Analytics 4 Integration

This document describes the Google Analytics 4 (GA4) implementation for the MTG Deck to PNG application.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setup & Configuration](#setup--configuration)
- [Event Tracking Implementation](#event-tracking-implementation)
- [Google Analytics Dashboard Setup](#google-analytics-dashboard-setup)
- [Development & Debugging](#development--debugging)
- [Best Practices for Extension](#best-practices-for-extension)
- [GDPR Compliance](#gdpr-compliance)

## Architecture Overview

The GA4 integration follows a clean, modular architecture designed for Next.js 14 App Router:

```
├── types/analytics.ts              # TypeScript interfaces for GA4 events
├── utils/analytics.ts              # Core analytics utilities
├── hooks/useAnalytics.ts           # React hook for event tracking
├── components/GoogleAnalytics.tsx  # GA4 initialization component
└── app/layout.tsx                  # Root integration point
```

### Key Design Principles

1. **TypeScript First**: All events are strongly typed for safety and autocomplete
2. **Environment-Based**: Conditional loading based on `NEXT_PUBLIC_GA_ID`
3. **Privacy-Focused**: Supports Do Not Track, IP anonymization
4. **Error Resilient**: Graceful fallbacks when GA is unavailable
5. **Development Friendly**: Console logging in development mode

## Setup & Configuration

### 1. Environment Variables

Create a `.env.local` file in the project root (or use your hosting platform's environment configuration):

```bash
# Required: Your Google Analytics 4 Measurement ID
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

To get your GA4 Measurement ID:

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property (or use existing)
3. Navigate to Admin → Data Streams → Web
4. Copy the Measurement ID (format: G-XXXXXXXXXX)

### 2. Development Setup

For local development, you can use a dummy GA ID:

```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

This allows you to:

- Test the integration without sending real data
- See console logs of tracked events
- Validate event parameters

### 3. Production Setup

On your hosting platform (Netlify, Vercel, etc.):

1. Add `NEXT_PUBLIC_GA_ID` to environment variables
2. Set the value to your actual GA4 Measurement ID
3. Redeploy the application

## Event Tracking Implementation

### Automatic Tracking

The following events are tracked automatically:

#### Page Views

- Triggered on every route change
- Includes page path, title, and location
- Handled by `GoogleAnalytics` component

```typescript
// Automatic - no code needed
// Tracks: page_view event with page_path, page_title, page_location
```

### Manual Event Tracking

Use the `useAnalytics` hook in any component:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function MyComponent() {
    const analytics = useAnalytics()

    const handleClick = () => {
        analytics.trackButtonClick('My Button')
        // ... rest of logic
    }

    return <button onClick={handleClick}>Click Me</button>
}
```

### Available Tracking Methods

| Method                 | Purpose                   | Parameters                           |
| ---------------------- | ------------------------- | ------------------------------------ |
| `trackButtonClick`     | Track button clicks       | `buttonText`, optional params        |
| `trackLinkClick`       | Track navigation links    | `linkText`, `url`, optional params   |
| `trackFormSubmit`      | Track form submissions    | `formName`, optional params          |
| `trackFileUpload`      | Track file uploads        | `fileName`, `fileType`               |
| `trackDeckUpload`      | Track deck uploads        | `cardCount`, optional params         |
| `trackCardsFetch`      | Track card API fetches    | `GACardFetchEvent`                   |
| `trackImageGeneration` | Track image generation    | `GAImageGenerationEvent`             |
| `trackImageDownload`   | Track image downloads     | `imageFormat`, `cardCount`           |
| `trackAPIRequest`      | Track API calls           | `GAAPIEvent`                         |
| `trackAPIError`        | Track API errors          | `endpoint`, `status`, `errorMessage` |
| `trackError`           | Track application errors  | `error`, `fatal`                     |
| `trackTiming`          | Track performance metrics | `name`, `value`, `category`          |

### Custom Event Tracking

For custom events not covered by the hook:

```typescript
import { trackEvent, GA_EVENTS } from '@/utils/analytics'

trackEvent(GA_EVENTS.BUTTON_CLICK, {
    click_text: 'Custom Button',
    event_category: 'engagement',
    custom_param: 'value'
})
```

### MTG-Specific Events

The integration includes specialized tracking for MTG deck operations:

**Deck Upload**

```typescript
analytics.trackDeckUpload(75, {
    has_sideboard: true,
    deck_format: 'commander'
})
```

**Card Fetching**

```typescript
analytics.trackCardsFetch({
    cards_requested: 75,
    cards_found: 73,
    cards_missing: 2,
    fetch_method: 'collection'
})
```

**Image Generation**

```typescript
analytics.trackImageGeneration({
    image_variant: 'grid',
    image_size: 'ig_square',
    image_format: 'png',
    card_count: 75,
    sort_by: 'cmc'
})
```

## Google Analytics Dashboard Setup

### Recommended Events to Monitor

Create custom reports in GA4 for:

1. **User Flow**
    - Page views: `/` → `/create`
    - Conversion funnel: Upload → Configure → Download

2. **Deck Actions**
    - `deck_upload` - Track deck uploads
    - `cards_fetch` - Monitor card API usage
    - `image_generate` - Track image generations
    - `image_download` - Measure conversions

3. **Performance**
    - `api_request` - Monitor API latency
    - `timing_complete` - Track performance metrics

4. **Errors**
    - `error` - Application errors
    - `api_error` - API failures

### Creating Custom Reports

1. Go to **Explore** in Google Analytics
2. Create a new exploration
3. Add dimensions: `event_name`, `page_path`, `event_category`
4. Add metrics: `event_count`, `total_users`
5. Filter by custom parameters as needed

### Key Metrics Dashboard

Suggested metrics for your dashboard:

- **Total Conversions**: `image_download` events
- **Upload Success Rate**: `deck_upload` vs `cards_fetch` success
- **Average Cards per Deck**: Average of `card_count` parameter
- **API Performance**: Average `api_duration_ms`
- **Error Rate**: `error` events / total events

## Development & Debugging

### Viewing Events in Development

When running locally, all GA events are logged to the console:

```
[GA4] Initialized with ID: G-XXXXXXXXXX
[GA4] Page View: { page_path: "/create", page_title: "..." }
[GA4] Event: button_click { click_text: "Upload Decklist", ... }
```

### Testing Without GA ID

If `NEXT_PUBLIC_GA_ID` is not set:

- GA scripts won't load
- Events are logged to console (development only)
- No errors or warnings are shown

### Debug Mode in Production

To test GA in production without affecting analytics:

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/) Chrome extension
2. Enable debug mode
3. Open browser console to see detailed GA logs

### Common Issues

**Events not showing in GA4**

- Wait 24-48 hours for initial data
- Check Realtime reports for immediate feedback
- Verify `NEXT_PUBLIC_GA_ID` is set correctly

**TypeScript errors**

- Ensure all event parameters match interface definitions
- Import types from `@/types/analytics`

**Do Not Track blocking events**

- Events won't track if user has DNT enabled (by design)
- Test with DNT disabled in browser settings

## Best Practices for Extension

### Adding New Events

1. **Define the event type** in `types/analytics.ts`:

```typescript
export interface GAMyNewEvent extends GAEventParams {
    my_param: string
    my_count: number
}
```

2. **Add event name constant**:

```typescript
export const GA_EVENTS = {
    // ... existing events
    MY_NEW_EVENT: 'my_new_event'
} as const
```

3. **Create tracking method** in `hooks/useAnalytics.ts`:

```typescript
const trackMyNewEvent = useCallback((params: GAMyNewEvent) => {
    trackEvent(GA_EVENTS.MY_NEW_EVENT, {
        event_category: 'my_category',
        ...params
    })
}, [])

return {
    // ... existing methods
    trackMyNewEvent
}
```

4. **Use in component**:

```typescript
const analytics = useAnalytics()
analytics.trackMyNewEvent({
    my_param: 'value',
    my_count: 42
})
```

### Event Naming Conventions

- Use snake_case for event names and parameters
- Prefix custom events with domain (e.g., `deck_*`, `api_*`)
- Keep event names concise but descriptive
- Include category for grouping: `event_category`

### Parameter Guidelines

- **Required params**: Type them as required in interfaces
- **Optional params**: Use `?` in TypeScript interfaces
- **Common params**: Reuse from `GAEventParams`
- **Descriptive names**: Prefer `card_count` over `count`

### Performance Considerations

- Events are sent asynchronously - no blocking
- Use `trackTiming` for performance metrics
- Batch similar events when possible
- Don't track on every render - use callbacks

## GDPR Compliance

The integration includes several privacy features:

### IP Anonymization

Enabled by default in `utils/analytics.ts`:

```typescript
window.gtag('config', measurementId, {
    anonymize_ip: true
})
```

### Do Not Track Support

Automatically respects browser DNT setting:

```typescript
if (navigator.doNotTrack === '1') return false
```

### Cookie Configuration

Secure, same-site cookies:

```typescript
cookie_flags: 'SameSite=None;Secure'
```

### User Consent

If you need cookie consent, wrap GA initialization:

```typescript
// In app/layout.tsx or providers.tsx
{userConsent && <GoogleAnalytics />}
```

### Data Retention

Configure in Google Analytics:

1. Admin → Data Settings → Data Retention
2. Set retention period (2, 14, 26, 38, 50 months, or no limit)

## Additional Resources

- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Analytics](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GDPR Compliance Guide](https://support.google.com/analytics/answer/9019185)

## Support & Troubleshooting

If you encounter issues:

1. Check browser console for GA logs (development)
2. Verify environment variable is set
3. Check GA4 Realtime reports
4. Review [GA4 troubleshooting guide](https://support.google.com/analytics/answer/9333790)

For project-specific issues, refer to the main repository documentation or create an issue.
