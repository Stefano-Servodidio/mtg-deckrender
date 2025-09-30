const fs = require('fs')
const path = require('path')

function cleanupOverlays() {
    const overlayDir = path.join(process.cwd(), 'public', 'overlays')

    if (fs.existsSync(overlayDir)) {
        console.log('🧹 Cleaning up overlay images...')
        fs.rmSync(overlayDir, { recursive: true, force: true })
        console.log('✅ Overlay images cleaned up')
    }
}

cleanupOverlays()
