import { NextRequest, NextResponse } from 'next/server'
import chalk from 'chalk'
import { CardItem } from '@/app/services/serverless/types'
import {
    extractCardImageData,
    filterValidImages,
    downloadAndResizeImages,
    calculateLayoutDimensions,
    splitImagesByType
} from './_utils/processing'
import {
    createCanvas,
    loadCountAssets,
    prepareCompositeOperations
} from './_utils/compositing'

interface DeckPngRequest {
    cards: CardItem[]
    options?: {
        rowSize?: number
    }
}

const defaultOptions = {
    rowSize: 7
}

export async function POST(request: NextRequest) {
    try {
        console.log(chalk.yellow('API: ', chalk.cyan('POST /api/deck-png')))
        const { cards, options = defaultOptions }: DeckPngRequest =
            await request.json()

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

        // Extract and filter card image data
        const cardImages = extractCardImageData(cards)
        const validCardImages = filterValidImages(cardImages)

        if (validCardImages.length === 0) {
            return NextResponse.json(
                { error: 'No valid images found.' },
                { status: 400 }
            )
        }

        // Set up image dimensions and layout
        const cardsPerRow = options?.rowSize || 7
        const cardWidth = 146 // Small image width from Scryfall
        const cardHeight = 204 // Small image height from Scryfall
        const spacing = 4 // Space between cards
        const rowHeight = cardHeight * 0.5 // Adjust row height to change visualization style
        const sideboardSpacing = 70 // Extra space before main sideboard

        // Download and resize all card images
        const successfulImages = await downloadAndResizeImages(
            validCardImages,
            cardWidth,
            cardHeight
        )

        if (successfulImages.length === 0) {
            return NextResponse.json(
                { error: 'Failed to download any card images.' },
                { status: 500 }
            )
        }

        // Calculate layout dimensions
        const {
            hasSideboard,
            totalMainRows,
            totalSideboardRows,
            totalRows,
            canvasWidth,
            canvasHeight
        } = calculateLayoutDimensions(
            successfulImages,
            cardsPerRow,
            cardWidth,
            rowHeight,
            spacing,
            sideboardSpacing
        )

        // Create base canvas
        const canvas = createCanvas(canvasWidth, canvasHeight)

        // Split images by type
        const { mainImages, sideboardImages } = splitImagesByType(successfulImages)

        // Load count overlay assets
        const countIconBuffers = await loadCountAssets()

        // Prepare all composite operations
        const operations = prepareCompositeOperations(
            mainImages,
            sideboardImages,
            cardsPerRow,
            cardWidth,
            rowHeight,
            spacing,
            sideboardSpacing,
            totalMainRows,
            countIconBuffers
        )

        // Create the composite image
        const compositeImage = canvas.composite(operations)
        const outputBuffer = await compositeImage.png().toBuffer()

        console.log(
            chalk.cyan(
                `Generated deck image with ${successfulImages.length} cards.`
            )
        )
        console.log(chalk.cyan(`Canvas size: ${canvasWidth}x${canvasHeight}`))
        console.log(
            chalk.cyan(
                `outputBuffer size: ${+(outputBuffer.length / (1024 * 1024)).toFixed(2)} MB`
            )
        )
        
        // Return the image as a response
        return new NextResponse(new Uint8Array(outputBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': outputBuffer.length.toString(),
                'Cache-Control': 'public, max-age=31536000',
                'Content-Disposition': 'inline; filename="mtg-deck.png"'
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
