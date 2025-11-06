const sharp = require('sharp')
const { getStore } = require('@netlify/blobs')

// Initialize Netlify Blobs store
function getOverlayStore() {
    const siteID = process.env.NETLIFY_SITE_ID
    const token = process.env.NETLIFY_AUTH_TOKEN

    if (!siteID || !token) {
        throw new Error(
            'Missing required environment variables: NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN'
        )
    }

    return getStore({
        name: 'overlay-images',
        siteID,
        token
    })
}

/**
 * Save overlay to Netlify Blobs
 */
async function saveOverlayToBlobs(overlayKey, buffer) {
    try {
        await getOverlayStore().set(overlayKey, buffer)
        return true
    } catch (error) {
        console.error(`Error saving overlay to Blobs: ${overlayKey}`, error)
        return false
    }
}

/**
 * List all stored overlay images
 */
async function listStoredOverlays() {
    try {
        const { blobs } = await getOverlayStore().list()
        return blobs.map((blob) => blob.key)
    } catch (error) {
        console.error('Error listing stored overlays:', error)
        return []
    }
}

/**
 * Generate SVG for a specific quantity overlay
 */
function generateOverlaySvg(count) {
    const envSize = process.env.OVERLAY_SIZE
    const defaultSize = 110
    if (!envSize) {
        console.error(
            'Error: OVERLAY_SIZE environment variable is not set. Using default size of 110.'
        )
    }
    const overlaySize = parseInt(envSize, 10) || defaultSize
    const scale = overlaySize / defaultSize
    const fontSizeMap = {
        large: Math.floor(64 * scale),
        medium: Math.floor(52 * scale),
        small: Math.floor(40 * scale)
    }

    const fontSize =
        count > 99
            ? fontSizeMap.small
            : count > 9
              ? fontSizeMap.medium
              : fontSizeMap.large
    console.log('overlaySize:', overlaySize)
    console.log('fontSizeMap:', fontSizeMap)
    console.log('fontSize:', fontSize)
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${overlaySize}" height="${overlaySize}" viewBox="0 0 ${overlaySize} ${overlaySize}">
            <rect width="100%" height="100%" rx="5%" fill="#000000" stroke="#474747ff" stroke-width="2" />
            <text x="50%" y="50%" 
                  fill="#FFFFFF" 
                  font-size="${fontSize}"
                  font-family="Arial, Helvetica, sans-serif"
                  font-weight="bold"
                  text-anchor="middle"
                  dominant-baseline="middle">x${count}</text>
        </svg>`
}

/**
 * Generate overlay blob and save to Netlify Blobs
 */
async function generateAndSaveOverlay(count) {
    const overlayKey = `x${count}`

    try {
        // Generate SVG
        const svg = generateOverlaySvg(count)

        // Convert SVG to PNG buffer
        const buffer = await sharp(Buffer.from(svg)).png().toBuffer()

        // Save to Netlify Blobs
        const success = await saveOverlayToBlobs(overlayKey, buffer)

        return success
    } catch (error) {
        console.error(`Error generating overlay x${count}:`, error)
        return false
    }
}

/**
 * Main function to generate all overlay blobs
 */
async function generateOverlays() {
    console.log('🎨 Generating overlay blobs for Netlify Blobs...')

    const totalOverlays = 200
    let successCount = 0
    let failCount = 0

    // Generate overlays
    for (let count = 2; count <= totalOverlays; count++) {
        const success = await generateAndSaveOverlay(count)

        if (success) {
            successCount++
            process.stdout.write(
                `\r   ✓ Generated ${successCount}/${totalOverlays - 1} overlays`
            )
        } else {
            failCount++
        }
    }

    console.log(`\n✅ Successfully generated ${successCount} overlay blobs`)
    if (failCount > 0) {
        console.log(`❌ Failed to generate ${failCount} overlays`)
    }

    // List all stored overlays
    console.log('\n📋 Listing stored overlays...')
    const storedOverlays = await listStoredOverlays()
    console.log(`Total overlays in storage: ${storedOverlays.length}`)
}

// Run the script
generateOverlays().catch((error) => {
    console.error('❌ Error generating overlay blobs:', error)
    process.exit(1)
})
