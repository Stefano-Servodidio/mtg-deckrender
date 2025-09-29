import path from 'path'
import fs from 'fs/promises'

/**
 * Load an asset file as a buffer
 */
export async function getAssetBuffer(
    filePath: string,
    fallbackPath?: string
): Promise<Buffer> {
    const assetPath = path.join(process.cwd(), filePath)
    try {
        return await fs.readFile(assetPath)
    } catch (error) {
        console.error(`Failed to load asset ${filePath}:`, error)
        if (!fallbackPath) return Buffer.alloc(0)
        const fallbackAssetPath = path.join(process.cwd(), fallbackPath)
        return await fs.readFile(fallbackAssetPath)
    }
}
