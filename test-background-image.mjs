import sharp from 'sharp'

async function testBackgroundImage() {
    try {
        // Create a simple test image as base64
        const testImageBuffer = await sharp({
            create: {
                width: 100,
                height: 100,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 1 }
            }
        })
            .png()
            .toBuffer()

        const base64Image = `data:image/png;base64,${testImageBuffer.toString('base64')}`
        console.log('Created test base64 image, length:', base64Image.length)

        // Test extraction and processing
        const base64Data = base64Image.includes(',')
            ? base64Image.split(',')[1]
            : base64Image

        const imageBuffer = Buffer.from(base64Data, 'base64')
        console.log('Decoded buffer size:', imageBuffer.length)

        // Test resizing
        const resizedBuffer = await sharp(imageBuffer)
            .resize(1080, 1080, {
                fit: 'cover',
                position: 'center'
            })
            .toBuffer()

        console.log('Resized buffer size:', resizedBuffer.length)

        // Test compositing
        const canvas = sharp({
            create: {
                width: 1080,
                height: 1080,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })

        const result = await canvas
            .composite([
                {
                    input: resizedBuffer,
                    left: 0,
                    top: 0
                }
            ])
            .png()
            .toBuffer()

        console.log('Final composite size:', result.length)
        console.log('✅ Background image processing works!')
    } catch (error) {
        console.error('❌ Error:', error)
    }
}

testBackgroundImage()
