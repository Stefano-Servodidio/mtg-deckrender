import { NextRequest, NextResponse } from 'next/server'
import chalk from 'chalk'
import {
    calculateCanvasDimensions,
    calculateCardDimensions,
    resizeImages,
    sortCards
} from './_utils/processing'
import {
    prepareCardOperations,
    createCanvas,
    createCompositeImage,
    prepareQuantityOverlayOperations
} from './_utils/compositing'
import { DeckPngOptions, DeckPngRequest } from '@/app/types/api'
import { downloadAllCardImages } from './_utils/api'

const defaultOptions: DeckPngOptions = {
    imageSize: 'ig_square' as const,
    imageVariant: 'grid' as const,
    imageResolution: 'standard' as const,
    backgroundStyle: 'transparent' as const,
    sortBy: 'cmc' as const,
    sortDirection: 'asc' as const,
    fileType: 'png' as const,
    includeCardCount: true as const
}

export async function POST(request: NextRequest) {
    try {
        console.log(chalk.yellow('API: ', chalk.cyan('POST /api/deck-png')))
        const { cards, options: requestOptions }: DeckPngRequest =
            await request.json()

        const options = { ...defaultOptions, ...(requestOptions || {}) }
        console.log('Options:', options)
        if (!cards || !Array.isArray(cards)) {
            return NextResponse.json(
                { error: 'Invalid request. Expected cards array.' },
                { status: 400 }
            )
        }

        if (cards.length === 0) {
            return NextResponse.json(
                { error: 'No cards provided.' },
                { status: 400 }
            )
        }

        // Create a readable stream for real-time progress updates
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send initial progress
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'progress',
                                current: 0,
                                total: 100,
                                message: 'Starting deck image generation...'
                            })}\n\n`
                        )
                    )

                    // Filter out invalid cards
                    const validCards = cards.filter(
                        (card) => card.image_uri && card.quantity > 0
                    )

                    //Sort cards for processing
                    const validCardImages = sortCards(
                        validCards,
                        options.sortBy,
                        options.sortDirection
                    )

                    if (validCardImages.length === 0) {
                        controller.enqueue(
                            new TextEncoder().encode(
                                `data: ${JSON.stringify({
                                    type: 'error',
                                    error: 'No valid images found.',
                                    message: 'No valid card images found'
                                })}\n\n`
                            )
                        )
                        controller.close()
                        return
                    }

                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'progress',
                                current: 10,
                                total: 100,
                                message: `Processing ${validCardImages.length} cards...`
                            })}\n\n`
                        )
                    )

                    // Download all card images with progress tracking
                    const [successfulImages, failedImages] =
                        await downloadAllCardImages(
                            validCardImages,
                            (current, total, cardName) => {
                                const progressPercentage =
                                    10 + Math.round((current / total) * 50) // 10-60%
                                controller.enqueue(
                                    new TextEncoder().encode(
                                        `data: ${JSON.stringify({
                                            type: 'progress',
                                            current: progressPercentage,
                                            total: 100,
                                            message: `Downloading image for ${cardName}...`
                                        })}\n\n`
                                    )
                                )
                            }
                        )

                    if (successfulImages.length === 0) {
                        controller.enqueue(
                            new TextEncoder().encode(
                                `data: ${JSON.stringify({
                                    type: 'error',
                                    error: 'Failed to download any card images.',
                                    message: 'Failed to download card images'
                                })}\n\n`
                            )
                        )
                        controller.close()
                        return
                    }

                    if (failedImages.length > 0) {
                        controller.enqueue(
                            new TextEncoder().encode(
                                `data: ${JSON.stringify({
                                    type: 'progress',
                                    current: 60,
                                    total: 100,
                                    message: `Warning: Failed to download ${failedImages.length} images. Proceeding with ${successfulImages.length} images.`
                                })}\n\n`
                            )
                        )
                    }

                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'progress',
                                current: 60,
                                total: 100,
                                message: 'Calculating layout...'
                            })}\n\n`
                        )
                    )

                    const canvasDimensions = calculateCanvasDimensions(
                        options.imageSize,
                        options.imageResolution
                    )

                    const cardDimensions = calculateCardDimensions(
                        successfulImages,
                        canvasDimensions,
                        options.imageSize,
                        options.imageVariant
                    )

                    const resizedImages = await resizeImages(
                        successfulImages,
                        cardDimensions
                    )

                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'progress',
                                current: 70,
                                total: 100,
                                message: 'Creating canvas...'
                            })}\n\n`
                        )
                    )

                    // Create base canvas with background style
                    const canvas = createCanvas(
                        canvasDimensions,
                        options.backgroundStyle,
                        options.customBackground
                    )

                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'progress',
                                current: 80,
                                total: 100,
                                message: 'Arranging cards...'
                            })}\n\n`
                        )
                    )

                    const cardOperations = prepareCardOperations(
                        resizedImages,
                        cardDimensions,
                        options.imageVariant,
                        options.imageSize
                    )

                    const overlayOperations = options.includeCardCount
                        ? prepareQuantityOverlayOperations(
                              resizedImages,
                              cardDimensions,
                              options.imageVariant,
                              options.imageSize
                          )
                        : []

                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'progress',
                                current: 90,
                                total: 100,
                                message: 'Generating final image...'
                            })}\n\n`
                        )
                    )

                    const outputBuffer = await createCompositeImage(
                        canvas,
                        cardOperations,
                        overlayOperations,
                        options.fileType
                    )

                    console.log(
                        chalk.cyan(
                            `Generated deck image with ${successfulImages.length} cards.`
                        )
                    )
                    console.log(
                        chalk.cyan(
                            `Canvas size: ${canvasDimensions.width}x${canvasDimensions.height}`
                        )
                    )
                    console.log(
                        chalk.cyan(
                            `outputBuffer size: ${+(outputBuffer.length / (1024 * 1024)).toFixed(2)} MB`
                        )
                    )

                    // Convert buffer to base64 for transmission
                    const base64Image = outputBuffer.toString('base64')

                    // Send final result
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'complete',
                                result: {
                                    imageData: base64Image,
                                    width: canvasDimensions.width,
                                    height: canvasDimensions.height,
                                    cardCount: successfulImages.length
                                },
                                message: `Generated deck image with ${successfulImages.length} cards`
                            })}\n\n`
                        )
                    )
                } catch (error) {
                    console.error('Error in deck PNG stream:', error)
                    controller.enqueue(
                        new TextEncoder().encode(
                            `data: ${JSON.stringify({
                                type: 'error',
                                error: 'Internal server error while processing cards',
                                message: 'Failed to generate deck image'
                            })}\n\n`
                        )
                    )
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no' // Disable nginx buffering
            }
        })
    } catch (error) {
        console.error('Error processing deck PNG request:', error)
        return NextResponse.json(
            { error: 'Internal server error while processing cards' },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Deck PNG Generator API',
        usage: 'POST with { "cards": [{ "card": ScryfallCard, "quantity": number }], "options": {} }',
        description:
            'Creates a composite PNG image from Magic: The Gathering cards arranged in rows of 7',
        expectedFormat: {
            cards: [
                {
                    card: 'ScryfallCard object with image_uris',
                    quantity: 'number'
                }
            ],
            options: {
                rowSize: 'number of cards per row (optional, default: 7)'
            }
        },
        returns: 'PNG image buffer with all unique cards arranged in rows of 7'
    })
}
