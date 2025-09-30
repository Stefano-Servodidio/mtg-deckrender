const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

async function generateOverlays() {
    const outputDir = path.join(process.cwd(), 'public', 'overlays')

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    console.log('🎨 Generating overlay images...')

    const totalOverlays = 100

    // Generate overlays for quantities 2-100
    for (let count = 2; count <= totalOverlays; count++) {
        const filePath = path.join(outputDir, `x${count}.png`)
        if (fs.existsSync(filePath)) {
            process.stdout.write(`\r   Skipping x${count}.png (already exists)`)
            continue
        }
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="125" height="125" viewBox="0 0 125 125">
                <rect width="100%" height="100%" rx="5%" fill="#000000" stroke="#474747ff" stroke-width="2" />
                <text x="50%" y="50%" 
                      fill="#FFFFFF" 
                      font-size=${count > 99 ? '"48"' : count > 9 ? '"60"' : '"72"'}
                      font-family="Arial, Helvetica, sans-serif"
                      font-weight="bold"
                      text-anchor="middle"
                      dominant-baseline="middle">x${count}</text>
            </svg>`

        await sharp(Buffer.from(svg))
            .png()
            .toFile(path.join(outputDir, `x${count}.png`))

        process.stdout.write(
            `\r   Generated ${count}/${totalOverlays} overlays`
        )
    }

    console.log('\n✅ All overlays generated successfully!')
}

generateOverlays().catch((error) => {
    console.error('❌ Error generating overlays:', error)
    process.exit(1)
})
