import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import chalk from 'chalk'
import { CardItem } from '@/app/services/serverless/types'
import {
    getAssetBuffer,
    prepareCardOperations,
    prepareCountOperations
} from '@/app/utils/api'

interface DeckPngRequest {
    cards: CardItem[]
    options?: {
        rowSize?: number
    }
}

interface CardImageData {
    name: string
    quantity: number
    type: 'main' | 'sideboard'
    imageUri: string
    manaCost?: string
    typeLine?: string
    rarity?: string
}

export interface CardImageBuffer {
    name: string
    type: 'main' | 'sideboard'
    buffer: Buffer
    quantity: number
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

        // Extract image URIs and card data
        const cardImages: CardImageData[] = cards.map(
            ({ card, type, quantity }) => ({
                name: card.name,
                quantity,
                type,
                imageUri: card.image_uris?.small || '',
                manaCost: card.mana_cost || '',
                typeLine: card.type_line || '',
                rarity: card.rarity || 'common'
            })
        )

        // Filter out cards without image URIs or invalid quantities
        const validCardImages = cardImages.filter(
            (card) => card.imageUri && card.quantity > 0 && card.quantity <= 4
        )

        if (validCardImages.length === 0) {
            return NextResponse.json(
                { error: 'No valid images found.' },
                { status: 400 }
            )
        }

        // Download all card images
        const cardImageBuffers = await Promise.all(
            validCardImages.map(async (card) => {
                try {
                    const response = await fetch(card.imageUri)
                    if (!response.ok) {
                        throw new Error(
                            `Failed to fetch image for ${card.name}`
                        )
                    }
                    const buffer = await response.arrayBuffer()
                    return {
                        name: card.name,
                        type: card.type,
                        buffer: Buffer.from(buffer),
                        quantity: card.quantity
                    }
                } catch (error) {
                    console.error(
                        `Error fetching image for ${card.name}:`,
                        error
                    )
                    return null
                }
            })
        )

        // Filter out failed downloads
        const successfulImages = [
            ...cardImageBuffers.filter((img) => img !== null)
        ]

        if (successfulImages.length === 0) {
            return NextResponse.json(
                { error: 'Failed to download any card images.' },
                { status: 500 }
            )
        }

        // Create composite image using Sharp
        const cardsPerRow = options?.rowSize || 7
        const cardWidth = 146 // Small image width from Scryfall
        const cardHeight = 204 // Small image height from Scryfall
        const spacing = 4 // Space between cards
        const sideboardSpacing = 70 // Extra space before main sideboard
        const hasSideboard = successfulImages.some(
            (img) => img!.type === 'sideboard'
        )

        const totalRows = Math.ceil(successfulImages.length / cardsPerRow)
        const totalMainRows = Math.ceil(
            successfulImages.filter((img) => img!.type === 'main').length /
                cardsPerRow
        )
        const canvasWidth =
            cardWidth * cardsPerRow + spacing * (cardsPerRow - 1) + spacing * 2 // Add padding
        const canvasHeight =
            cardHeight * totalRows +
            spacing * (totalRows - 1) +
            spacing * 2 +
            (hasSideboard ? sideboardSpacing : 0) // Add padding

        // Create base canvas
        const canvas = sharp({
            create: {
                width: canvasWidth,
                height: canvasHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })

        const mainImages = successfulImages.filter(
            (img) => img!.type === 'main'
        )
        const sideboardImages = successfulImages.filter(
            (img) => img!.type === 'sideboard'
        )

        // Prepare card composite operations
        const mainOperations = prepareCardOperations(
            mainImages,
            cardsPerRow,
            cardWidth,
            cardHeight,
            spacing,
            sideboardSpacing
        )

        const sideboardOperations = prepareCardOperations(
            sideboardImages,
            cardsPerRow,
            cardWidth,
            cardHeight,
            spacing,
            sideboardSpacing,
            cardHeight * totalMainRows
        )

        const x1Buffer = await getAssetBuffer('x1.png')
        const x2Buffer = await getAssetBuffer('x2.png')
        const x3Buffer = await getAssetBuffer('x3.png')
        const x4Buffer = await getAssetBuffer('x4.png')

        const countMap: { [key: number]: Buffer } = {
            1: x1Buffer,
            2: x2Buffer,
            3: x3Buffer,
            4: x4Buffer
        }

        // Prepare quantity overlay operations
        const mainCountOperations = prepareCountOperations(
            mainImages,
            cardsPerRow,
            cardWidth,
            cardHeight,
            spacing,
            sideboardSpacing,
            countMap
        )

        const sideboardCountOperations = prepareCountOperations(
            sideboardImages,
            cardsPerRow,
            cardWidth,
            cardHeight,
            spacing,
            sideboardSpacing,
            countMap,
            cardHeight * totalMainRows
        )

        // Create the composite image
        const compositeImage = canvas.composite([
            ...mainOperations,
            ...sideboardOperations,
            ...mainCountOperations,
            ...sideboardCountOperations
        ])
        const outputBuffer = await compositeImage.png().toBuffer()

        chalk
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
