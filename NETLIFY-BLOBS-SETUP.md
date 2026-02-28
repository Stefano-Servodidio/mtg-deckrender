# Netlify Blobs Setup Guide

This application uses Netlify Blobs for persistent caching of card images and quantity overlays.

## How It Works

The app uses a 3-tier caching strategy:

1. **In-Memory Cache** - Fastest, stores ~200 images
2. **Netlify Blobs** - Persistent cloud storage (90-day revalidation)
3. **Scryfall API** - Last resort, downloads from source

## Automatic Configuration on Netlify

When deployed to Netlify, **no manual configuration is required**. The Netlify Blobs SDK automatically:

- Detects it's running on Netlify
- Uses the platform's built-in authentication
- Connects to your site's blob storage

**You do NOT need to set `NETLIFY_SITE_ID` or `NETLIFY_AUTH_TOKEN` in the Netlify dashboard.**

## Local Development Setup

For local development (optional), you can connect to Netlify Blobs:

1. Create a personal access token in your Netlify account:
    - Go to: https://app.netlify.com/user/applications#personal-access-tokens
    - Click "New access token"
    - Give it a descriptive name (e.g., "MTG Deck Dev")
    - Copy the token (starts with `nfp_`)

2. Find your site ID:
    - Go to your site's dashboard on Netlify
    - Site settings → General → Site details
    - Copy the "Site ID" (looks like: `4b9171be-84a6-4aa8-a5c3-8df3eafe8448`)

3. Create a `.env.local` file in the project root:

    ```bash
    NETLIFY_SITE_ID=your-site-id-here
    NETLIFY_AUTH_TOKEN=your-token-here
    ```

4. **Important:** Never commit `.env.local` to git - it's already in `.gitignore`

## Disabling Blobs in Development

If you don't want to use Netlify Blobs during local development:

1. Don't set `NETLIFY_SITE_ID` or `NETLIFY_AUTH_TOKEN` in `.env.local`
2. The app will automatically fall back to downloading images directly from Scryfall
3. This is perfectly fine for development and testing

## Verifying Blobs Integration

You can check if Blobs is working:

1. **In production:** Visit `https://your-site.com/api/admin/card-cache-stats`
2. **Locally:** Run `npm run dev` and visit `http://localhost:3000/api/admin/card-cache-stats`

This will show how many images are currently cached in Blobs.

## Netlify Configuration

The `netlify.toml` file already includes the necessary Blobs configuration:

```toml
[context.production.environment]
  NETLIFY_BLOBS_CONTEXT = "production"

[context.deploy-preview.environment]
  NETLIFY_BLOBS_CONTEXT = "deploy-preview"
```

This ensures that production and deploy previews use separate blob stores.

## Security Best Practices

- ✅ **DO:** Let Netlify handle authentication automatically in production
- ✅ **DO:** Use personal access tokens for local development only
- ✅ **DO:** Keep tokens in `.env.local` (never commit to git)
- ❌ **DON'T:** Set credentials in `.env.production`
- ❌ **DON'T:** Commit tokens to your repository
- ❌ **DON'T:** Share your personal access tokens

## Troubleshooting

### 401 Error: "BlobsInternalError"

This usually means:

- ❌ You manually set credentials in Netlify dashboard (remove them)
- ❌ You have credentials in `.env.production` (delete them)
- ✅ Let Netlify auto-detect credentials

**Solution:** Remove any `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` from:

- Netlify dashboard environment variables
- `.env.production` file (or any committed env files)
- Redeploy the site

### Images Not Caching Locally

This is normal! If you don't have credentials in `.env.local`, the app will:

- Skip Netlify Blobs
- Download directly from Scryfall
- Still use in-memory caching (works fine for development)

### Checking Blob Storage

Visit the admin endpoints to see cache statistics:

- `/api/admin/card-cache-stats` - Card image cache
- `/api/admin/overlay-cache-stats` - Quantity overlay cache

## Generating Overlay Images

To pre-populate the overlay cache with x2-x100 quantity indicators:

```bash
# Ensure you have credentials in .env.local
npm run generate:overlays
```

This is optional - overlays will be generated on-demand if not cached.
