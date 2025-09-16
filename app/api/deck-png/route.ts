import { NextRequest, NextResponse } from 'next/server'
import chalk from 'chalk'
import { DeckPngRequest } from './_types'
import {
    calculateCanvasDimensions,
    calculateRowHeight,
    calculateCardDimensions
} from './_utils/config'
import {
    filterAndSortCards,
    downloadAllCardImages,
    calculateLayoutMetrics
} from './_utils/processing'
import {
    loadQuantityOverlayAssets,
    prepareCardOperations,
    prepareQuantityOverlayOperations,
    createCanvas,
    createCompositeImage
} from './_utils/compositing'

const defaultOptions = {
    rowSize: 7, // DECK_LAYOUT_CONFIG.row.defaultCardsPerRow,
    imageSize: 'medium' as const,
    imageVariant: 'grid' as const,
    imageOrientation: 'vertical' as const,
    backgroundStyle: 'transparent' as const,
    sortBy: 'cmc' as const,
    sortDirection: 'asc' as const,
    fileType: 'png' as const,
    mtgFormat: null,
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
                    console.log(cards)

                    // Filter and sort cards for processing
                    const validCardImages = filterAndSortCards(
                        cards,
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

                    // Create composite image using Sharp
                    const cardsPerRow =
                        options?.rowSize || defaultOptions.rowSize

                    // Download all card images with progress tracking
                    const successfulImages = await downloadAllCardImages(
                        validCardImages,
                        options.imageSize,
                        options.imageOrientation,
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

                    // Calculate layout metrics
                    const {
                        mainImages,
                        sideboardImages,
                        totalMainRows,
                        totalSideboardRows,
                        hasSideboard
                    } = calculateLayoutMetrics(successfulImages, cardsPerRow)

                    const totalRows =
                        totalMainRows + (hasSideboard ? totalSideboardRows : 0)
                    const { width: canvasWidth, height: canvasHeight } =
                        calculateCanvasDimensions(
                            cardsPerRow,
                            totalRows,
                            hasSideboard,
                            options.imageSize,
                            options.imageOrientation,
                            options.imageVariant
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
                        canvasWidth, 
                        canvasHeight, 
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

                    // Load quantity overlay assets (conditionally based on includeCardCount)
                    const quantityAssets = options.includeCardCount ? 
                        await loadQuantityOverlayAssets() : {}

                    // Calculate row height for sideboard positioning
                    const cardDimensions = calculateCardDimensions(options.imageSize, options.imageOrientation)
                    const rowHeight = calculateRowHeight(options.imageVariant, cardDimensions.height)
                    const mainDeckRowHeight = rowHeight * totalMainRows

                    // Prepare card composite operations
                    const mainOperations = prepareCardOperations(
                        mainImages,
                        cardsPerRow,
                        options.imageSize,
                        options.imageOrientation,
                        options.imageVariant
                    )
                    const sideboardOperations = prepareCardOperations(
                        sideboardImages,
                        cardsPerRow,
                        options.imageSize,
                        options.imageOrientation,
                        options.imageVariant,
                        mainDeckRowHeight
                    )

                    // Prepare quantity overlay operations (only if includeCardCount is true)
                    const mainOverlayOperations = options.includeCardCount ?
                        prepareQuantityOverlayOperations(
                            mainImages,
                            cardsPerRow,
                            quantityAssets,
                            options.imageSize,
                            options.imageOrientation,
                            options.imageVariant
                        ) : []

                    const sideboardOverlayOperations = options.includeCardCount ?
                        prepareQuantityOverlayOperations(
                            sideboardImages,
                            cardsPerRow,
                            quantityAssets,
                            options.imageSize,
                            options.imageOrientation,
                            options.imageVariant,
                            mainDeckRowHeight
                        ) : []

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

                    // Create the composite image
                    const allCardOperations = [
                        ...mainOperations,
                        ...sideboardOperations
                    ]
                    const allOverlayOperations = [
                        ...mainOverlayOperations,
                        ...sideboardOverlayOperations
                    ]
                    const outputBuffer = await createCompositeImage(
                        canvas,
                        allCardOperations,
                        allOverlayOperations,
                        options.fileType
                    )

                    console.log(
                        chalk.cyan(
                            `Generated deck image with ${successfulImages.length} cards.`
                        )
                    )
                    console.log(
                        chalk.cyan(
                            `Canvas size: ${canvasWidth}x${canvasHeight}`
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
                                    width: canvasWidth,
                                    height: canvasHeight,
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
