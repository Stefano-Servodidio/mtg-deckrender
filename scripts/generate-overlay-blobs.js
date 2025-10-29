const sharp = require('sharp')
const path = require('path')
const chalk = require('chalk')

// Import the overlay storage functions
// Note: We need to use dynamic import for ES modules in CommonJS context
let overlayStorage

async function initializeStorage() {
    // Dynamically import the ES module
    const module = await import(
        '../utils/storage/overlayImageStorage.js'
    ).catch((err) => {
        console.error('Error importing overlay storage:', err)
        process.exit(1)
    })

    return {
        saveOverlayToBlobs: module.saveOverlayToBlobs,
        listStoredOverlays: module.listStoredOverlays
    }
}

/**
 * Generate SVG for a specific quantity overlay
 */
function generateOverlaySvg(count) {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 110 110">
            <rect width="100%" height="100%" rx="5%" fill="#000000" stroke="#474747ff" stroke-width="2" />
            <text x="50%" y="50%" 
                  fill="#FFFFFF" 
                  font-size=${count > 99 ? '"40"' : count > 9 ? '"52"' : '"64"'}
                  font-family="Arial, Helvetica, sans-serif"
                  font-weight="bold"
                  text-anchor="middle"
                  dominant-baseline="middle">x${count}</text>
        </svg>`
}

/**
 * Generate overlay blob and save to Netlify Blobs
 */
async function generateAndSaveOverlay(count, overlayStorage) {
    const overlayKey = `x${count}`

    try {
        // Generate SVG
        const svg = generateOverlaySvg(count)

        // Convert SVG to PNG buffer
        const buffer = await sharp(Buffer.from(svg)).png().toBuffer()

        // Save to Netlify Blobs with metadata
        await overlayStorage.saveOverlayToBlobs(overlayKey, buffer, count, svg)

        return true
    } catch (error) {
        console.error(chalk.red(`Error generating overlay x${count}:`), error)
        return false
    }
}

/**
 * Main function to generate all overlay blobs
 */
async function generateOverlayBlobs() {
    console.log(chalk.blue('🎨 Generating overlay blobs for Netlify Blobs...'))

    // Initialize storage
    overlayStorage = await initializeStorage()

    const totalOverlays = 150
    let successCount = 0
    let failCount = 0

    // Generate overlays for quantities 2-150
    for (let count = 2; count <= totalOverlays; count++) {
        const success = await generateAndSaveOverlay(count, overlayStorage)

        if (success) {
            successCount++
            process.stdout.write(
                `\r   ${chalk.green('✓')} Generated ${successCount}/${totalOverlays - 1} overlays`
            )
        } else {
            failCount++
        }
    }

    console.log(
        `\n${chalk.green('✅ Successfully generated')} ${successCount} overlay blobs`
    )
    if (failCount > 0) {
        console.log(chalk.red(`❌ Failed to generate ${failCount} overlays`))
    }

    // List all stored overlays
    console.log(chalk.blue('\n📋 Listing stored overlays...'))
    const storedOverlays = await overlayStorage.listStoredOverlays()
    console.log(
        chalk.cyan(`Total overlays in storage: ${storedOverlays.length}`)
    )
}

// Run the script
generateOverlayBlobs().catch((error) => {
    console.error(chalk.red('❌ Error generating overlay blobs:'), error)
    process.exit(1)
})
