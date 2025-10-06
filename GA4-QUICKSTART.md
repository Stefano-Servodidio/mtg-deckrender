# Google Analytics 4 Integration - Quick Start Guide

This guide provides a quick reference for using the newly implemented GA4 integration.

## Setup (5 minutes)

### 1. Get Your GA4 Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property (or use existing)
3. Navigate to **Admin** → **Data Streams** → **Web**
4. Copy your Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variable

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**That's it!** The integration will automatically:
- Load GA4 script on page load
- Track page views on navigation
- Track all implemented events

## Verification

### Development Testing

1. Start the dev server: `npm run dev`
2. Open browser console (F12)
3. Look for `[GA4]` messages:
   ```
   [GA4] Initialized with ID: G-XXXXXXXXXX
   [GA4] Page View: { page_path: "/", ... }
   [GA4] Event: button_click { click_text: "...", ... }
   ```

### Production Testing

1. Deploy with `NEXT_PUBLIC_GA_ID` set
2. Visit your site
3. In GA4 dashboard, go to **Reports** → **Realtime**
4. You should see active users and events

## Event Reference

### Automatic Events

These events are tracked automatically without any code changes:

| Event | When Tracked |
|-------|-------------|
| `page_view` | Every route change |

### Implemented Events

These events are already integrated in the app:

| Event | Location | Tracks |
|-------|----------|--------|
| `link_click` | Navbar | Navigation clicks (Home, Create) |
| `deck_upload` | Create page | Deck text submission |
| `file_upload` | Create page | File drag & drop |
| `cards_fetch` | Create page | Card API fetching |
| `image_generate` | Create page | Image generation |
| `image_download` | Create page | PNG download |

### Custom Events

To add tracking to new features, use the `useAnalytics` hook:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function MyComponent() {
    const analytics = useAnalytics()

    const handleAction = () => {
        // Track the event
        analytics.trackButtonClick('My Action Button')
        
        // Your logic here
        doSomething()
    }

    return <button onClick={handleAction}>Do Something</button>
}
```

### Available Tracking Methods

```typescript
const analytics = useAnalytics()

// User interactions
analytics.trackButtonClick('Button Text')
analytics.trackLinkClick('Link Text', '/url')
analytics.trackFormSubmit('Form Name')
analytics.trackFileUpload('filename.txt', 'text/plain')

// MTG deck actions
analytics.trackDeckUpload(cardCount)
analytics.trackCardsFetch({
    cards_requested: 60,
    cards_found: 58,
    cards_missing: 2,
    fetch_method: 'collection'
})
analytics.trackImageGeneration({
    image_variant: 'grid',
    image_size: 'ig_square',
    image_format: 'png',
    card_count: 60
})
analytics.trackImageDownload('png', cardCount)

// System events
analytics.trackError(error, false) // false = non-fatal
analytics.trackTiming('operation_name', durationMs, 'category')
```

## Google Analytics Dashboard

### Recommended Reports

1. **Realtime Overview**
   - Path: Reports → Realtime
   - See: Active users, page views, events in real-time

2. **User Engagement**
   - Path: Reports → Engagement → Events
   - Filter by custom events: `deck_upload`, `cards_fetch`, `image_generate`, `image_download`

3. **Conversion Funnel**
   Create a custom funnel:
   - Step 1: `page_view` (path: `/`)
   - Step 2: `page_view` (path: `/create`)
   - Step 3: `deck_upload`
   - Step 4: `cards_fetch`
   - Step 5: `image_generate`
   - Step 6: `image_download`

### Custom Dimensions

Consider creating custom dimensions for:
- `card_count` - Number of cards in deck
- `image_variant` - Type of image (grid, spoiler, stacks)
- `fetch_method` - API fetch method (individual, collection)

## Troubleshooting

### Events not showing in GA4

**Wait 24-48 hours** for initial data to appear. For immediate feedback:
- Check **Realtime** reports
- Verify `NEXT_PUBLIC_GA_ID` is set correctly
- Check browser console for `[GA4]` messages

### Console shows "not tracked"

This is normal in development when:
- GA script is blocked by ad blocker
- User has Do Not Track enabled
- `NEXT_PUBLIC_GA_ID` is a dummy value

Events are still logged to console for debugging.

### TypeScript errors

Ensure you're importing types correctly:
```typescript
import { useAnalytics } from '@/hooks/useAnalytics'
import type { GAEventParams } from '@/types/analytics'
```

## Privacy Compliance

The integration includes:

✅ **IP Anonymization** - Enabled by default  
✅ **Do Not Track** - Respects DNT browser setting  
✅ **No Personal Data** - No PII collected  
✅ **Cookie Consent** - Ready for consent integration

### Adding Cookie Consent

If you need cookie consent, modify `app/layout.tsx`:

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
    const [hasConsent, setHasConsent] = useState(false)

    return (
        <html lang="en">
            <body>
                {hasConsent && <GoogleAnalytics />}
                <Providers>{children}</Providers>
                <CookieConsentBanner onAccept={() => setHasConsent(true)} />
            </body>
        </html>
    )
}
```

## Advanced Usage

### API Monitoring

Track API performance:

```typescript
const startTime = Date.now()
try {
    const response = await fetch('/api/cards')
    const duration = Date.now() - startTime
    
    analytics.trackAPIRequest({
        api_endpoint: '/api/cards',
        api_method: 'POST',
        api_status: response.status,
        api_duration_ms: duration
    })
} catch (error) {
    analytics.trackAPIError('/api/cards', 500, error.message)
}
```

### Custom Events

For events not covered by the hook:

```typescript
import { trackEvent, GA_EVENTS } from '@/utils/analytics'

trackEvent(GA_EVENTS.BUTTON_CLICK, {
    click_text: 'Custom Button',
    event_category: 'engagement',
    custom_param: 'custom_value'
})
```

## Resources

- [Full Documentation](./ANALYTICS.md) - Comprehensive guide
- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Analytics](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)

## Support

For issues or questions:
1. Check [ANALYTICS.md](./ANALYTICS.md)
2. Review browser console for `[GA4]` messages
3. Verify environment variable is set
4. Check GA4 Realtime reports for live data

---

**Implementation Status:** ✅ Complete  
**Tests:** 185/185 passing  
**Build:** Successful  
**Documentation:** Complete
