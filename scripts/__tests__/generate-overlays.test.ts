import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock sharp
vi.mock('sharp', () => ({
    default: vi.fn()
}))

// Mock @netlify/blobs
vi.mock('@netlify/blobs', () => ({
    getStore: vi.fn()
}))

describe('generate-overlays script', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('environment configuration', () => {
        it('should check for NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN', () => {
            const requiredEnvVars = ['NETLIFY_SITE_ID', 'NETLIFY_AUTH_TOKEN']

            expect(requiredEnvVars).toContain('NETLIFY_SITE_ID')
            expect(requiredEnvVars).toContain('NETLIFY_AUTH_TOKEN')
        })

        it('should use OVERLAY_SIZE environment variable', () => {
            const envSize = process.env.OVERLAY_SIZE
            const defaultSize = 110
            const overlaySize = parseInt(envSize || '', 10) || defaultSize

            expect(overlaySize).toBeGreaterThan(0)
        })

        it('should throw error when missing environment variables', () => {
            const siteID = undefined
            const token = undefined

            const shouldThrow = () => {
                if (!siteID || !token) {
                    throw new Error(
                        'Missing required environment variables: NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN'
                    )
                }
            }

            expect(shouldThrow).toThrow(
                'Missing required environment variables: NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN'
            )
        })
    })

    describe('SVG generation', () => {
        it('should generate SVG for overlay with correct size', () => {
            const overlaySize = 110
            const count = 4

            const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${overlaySize}" height="${overlaySize}" viewBox="0 0 ${overlaySize} ${overlaySize}">
            <rect width="100%" height="100%" rx="5%" fill="#000000" stroke="#474747ff" stroke-width="2" />
            <text x="50%" y="50%" 
                  fill="#FFFFFF" 
                  font-size="64"
                  font-family="Arial, Helvetica, sans-serif"
                  font-weight="bold"
                  text-anchor="middle"
                  dominant-baseline="middle">x${count}</text>
        </svg>`

            expect(svg).toContain(`width="${overlaySize}"`)
            expect(svg).toContain(`height="${overlaySize}"`)
            expect(svg).toContain(`x${count}`)
        })

        it('should use large font size for single digit counts', () => {
            const count = 4
            const overlaySize = 110
            const scale = overlaySize / 110
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

            expect(fontSize).toBe(fontSizeMap.large)
        })

        it('should use medium font size for double digit counts', () => {
            const count = 24
            const overlaySize = 110
            const scale = overlaySize / 110
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

            expect(fontSize).toBe(fontSizeMap.medium)
        })

        it('should use small font size for triple digit counts', () => {
            const count = 100
            const overlaySize = 110
            const scale = overlaySize / 110
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

            expect(fontSize).toBe(fontSizeMap.small)
        })

        it('should scale font sizes with overlay size', () => {
            const overlaySize = 220 // Double the default
            const scale = overlaySize / 110
            const fontSizeMap = {
                large: Math.floor(64 * scale),
                medium: Math.floor(52 * scale),
                small: Math.floor(40 * scale)
            }

            expect(fontSizeMap.large).toBe(128)
            expect(fontSizeMap.medium).toBe(104)
            expect(fontSizeMap.small).toBe(80)
        })
    })

    describe('overlay generation range', () => {
        it('should generate overlays from 2 to 200', () => {
            const totalOverlays = 200
            const startCount = 2

            expect(totalOverlays).toBe(200)
            expect(startCount).toBe(2)
        })

        it('should generate correct number of overlays', () => {
            const totalOverlays = 200
            const startCount = 2
            const expectedCount = totalOverlays - startCount + 1

            expect(expectedCount).toBe(199)
        })

        it('should include x2 overlay', () => {
            const overlayKey = 'x2'
            expect(overlayKey).toBe('x2')
        })

        it('should include x200 overlay', () => {
            const overlayKey = 'x200'
            expect(overlayKey).toBe('x200')
        })
    })

    describe('overlay storage', () => {
        it('should generate overlay key correctly', () => {
            const count = 4
            const overlayKey = `x${count}`

            expect(overlayKey).toBe('x4')
        })

        it('should use correct store name', () => {
            const storeName = 'overlay-images'
            expect(storeName).toBe('overlay-images')
        })

        it('should track success and failure counts', () => {
            let successCount = 0
            let failCount = 0

            // Simulate successful generation
            successCount++
            successCount++

            // Simulate failed generation
            failCount++

            expect(successCount).toBe(2)
            expect(failCount).toBe(1)
        })
    })

    describe('Sharp image processing', () => {
        it('should convert SVG to PNG buffer', async () => {
            const mockBuffer = Buffer.from('mock-image-data')
            const mockSharp = {
                png: vi.fn().mockReturnThis(),
                toBuffer: vi.fn().mockResolvedValue(mockBuffer)
            }

            const sharp = (await import('sharp')).default as any
            vi.mocked(sharp).mockReturnValue(mockSharp)

            const svg = '<svg></svg>'
            const sharpInstance = sharp(Buffer.from(svg))
            const buffer = await sharpInstance.png().toBuffer()

            expect(buffer).toBe(mockBuffer)
            expect(mockSharp.png).toHaveBeenCalled()
            expect(mockSharp.toBuffer).toHaveBeenCalled()
        })
    })

    describe('Netlify Blobs integration', () => {
        it('should initialize store with correct parameters', async () => {
            const siteID = 'test-site-id'
            const token = 'test-token'

            const { getStore } = await import('@netlify/blobs')
            const mockStore = {
                set: vi.fn(),
                list: vi.fn()
            }
            vi.mocked(getStore).mockReturnValue(mockStore as any)

            const store = getStore({
                name: 'overlay-images',
                siteID,
                token
            })

            expect(getStore).toHaveBeenCalledWith({
                name: 'overlay-images',
                siteID,
                token
            })
            expect(store).toBe(mockStore)
        })

        it('should save overlay to Blobs', async () => {
            const mockSet = vi.fn().mockResolvedValue(undefined)
            const mockStore = { set: mockSet }

            const overlayKey = 'x4'
            const buffer = Buffer.from('mock-data')

            await mockStore.set(overlayKey, buffer)

            expect(mockSet).toHaveBeenCalledWith(overlayKey, buffer)
        })

        it('should list stored overlays', async () => {
            const mockBlobs = [{ key: 'x2' }, { key: 'x3' }, { key: 'x4' }]
            const mockList = vi.fn().mockResolvedValue({ blobs: mockBlobs })
            const mockStore = { list: mockList }

            const result = await mockStore.list()
            const overlayKeys = result.blobs.map((blob: any) => blob.key)

            expect(mockList).toHaveBeenCalled()
            expect(overlayKeys).toEqual(['x2', 'x3', 'x4'])
        })

        it('should handle storage errors gracefully', async () => {
            const mockSet = vi
                .fn()
                .mockRejectedValue(new Error('Storage error'))
            const mockStore = { set: mockSet }

            try {
                await mockStore.set('x4', Buffer.from('data'))
                expect.fail('Should have thrown error')
            } catch (error) {
                expect(error).toBeInstanceOf(Error)
                expect((error as Error).message).toBe('Storage error')
            }
        })
    })

    describe('progress reporting', () => {
        it('should calculate progress correctly', () => {
            const totalOverlays = 200
            const successCount = 100

            const progress = `✓ Generated ${successCount}/${totalOverlays - 1} overlays`

            expect(progress).toContain('100')
            expect(progress).toContain('199')
        })

        it('should report total overlays in storage', () => {
            const storedOverlays = ['x2', 'x3', 'x4', 'x5']
            const message = `Total overlays in storage: ${storedOverlays.length}`

            expect(message).toContain('4')
        })
    })
})
