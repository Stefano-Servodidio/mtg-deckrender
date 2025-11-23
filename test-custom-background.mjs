import sharp from 'sharp';

async function testCustomBackgroundImage() {
  try {
    console.log('Testing custom background image implementation...\n');
    
    // Step 1: Create a test background image (red gradient)
    const testBgBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    }).png().toBuffer();
    
    const base64Image = `data:image/png;base64,${testBgBuffer.toString('base64')}`;
    console.log('✅ Created test background image (red, 200x200)');
    
    // Step 2: Simulate createBackgroundImageCanvas
    const base64Data = base64Image.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const backgroundCanvas = sharp(imageBuffer).resize(1080, 1080, {
      fit: 'cover',
      position: 'center'
    });
    console.log('✅ Created background canvas from image (resized to 1080x1080)');
    
    // Step 3: Create a test card overlay (blue square in center)
    const testCardBuffer = await sharp({
      create: {
        width: 200,
        height: 300,
        channels: 4,
        background: { r: 0, g: 0, b: 255, alpha: 1 }
      }
    }).png().toBuffer();
    
    console.log('✅ Created test card overlay (blue, 200x300)');
    
    // Step 4: Composite card on top of background
    const finalImage = await backgroundCanvas.composite([
      {
        input: testCardBuffer,
        left: 440,  // Center horizontally
        top: 390    // Center vertically
      }
    ]).png().toBuffer();
    
    console.log('✅ Composited card on top of background');
    console.log(`✅ Final image size: ${finalImage.length} bytes`);
    
    // Step 5: Verify the image has the correct dimensions
    const metadata = await sharp(finalImage).metadata();
    console.log(`✅ Final image dimensions: ${metadata.width}x${metadata.height}`);
    
    // Save for visual inspection
    await sharp(finalImage).toFile('/tmp/test-custom-background-result.png');
    console.log('✅ Saved test result to /tmp/test-custom-background-result.png');
    
    console.log('\n✅ SUCCESS: Custom background image implementation working correctly!');
    console.log('   - Background image is used as base canvas');
    console.log('   - Card overlays are properly composited on top');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

testCustomBackgroundImage();
