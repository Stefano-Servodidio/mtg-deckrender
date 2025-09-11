import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import chalk from 'chalk'
import { CardItem } from '@/app/services/serverless/types'

interface DeckPngRequest {
    cards: CardItem[]
    options?: {
        rowSize?: number
        // format?: 'PNG' | 'JPEG'
        // width?: number
        // height?: number
        // backgroundColor?: string
        // textColor?: string
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

const defaultOptions = {
    rowSize: 7
    // format: 'PNG' as 'PNG' | 'JPEG',
    // width: 800,
    // height: 1000,
    // backgroundColor: 'transparent',
    // textColor: 'black'
}

const svgCount =
    '<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" role="img" aria-label="x1 box"><rect x="0" y="0" width="35" height="35" rx="4" ry="4" fill="#000000"/><text x="50%" y="50%" fill="#FFFFFF" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle">x_count</text></svg>'

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

        // Filter out cards without image URIs
        const validCardImages = cardImages.filter((card) => card.imageUri)

        if (validCardImages.length === 0) {
            return NextResponse.json(
                { error: 'No valid card images found.' },
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

        // Filter out failed downloads and sort by type (main deck first)
        const successfulImages = [
            ...cardImageBuffers.filter((img) => img !== null)
        ].sort((a, b) => {
            if (a!.type === 'main' && b!.type === 'sideboard') return -1
            if (a!.type === 'sideboard' && b!.type === 'main') return 1
            return 0
        })

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

        // Prepare card composite operations
        const cardOperations = successfulImages.map((imageData, index) => {
            const row = Math.floor(index / cardsPerRow)
            const col = index % cardsPerRow

            const left = spacing + col * (cardWidth + spacing)
            const top =
                spacing +
                row * (cardHeight + spacing) +
                (imageData.type === 'sideboard' ? sideboardSpacing : 0)

            return {
                input: imageData.buffer,
                left,
                top
            }
        })

        // Prepare quantity overlay operations
        const countOperations = successfulImages
            .map((imageData, index) => {
                if (imageData.quantity < 2) return null // No overlay for single cards

                const row = Math.floor(index / cardsPerRow)
                const col = index % cardsPerRow

                const left =
                    spacing + col * (cardWidth + spacing) + cardWidth - 50
                const top =
                    spacing +
                    row * (cardHeight + spacing) +
                    28 +
                    (imageData.type === 'sideboard' ? sideboardSpacing : 0)

                let svgOverlay = svgCount.replace(
                    '_count',
                    imageData.quantity.toString()
                )

                return {
                    input: Buffer.from(svgOverlay),
                    left,
                    top
                }
            })
            .filter((op) => op !== null)

        // Create the composite image
        const compositeImage = canvas.composite([
            ...cardOperations,
            ...countOperations
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
                // format: 'PNG | JPEG (optional)'
                // width: 'number (optional, default: calculated)',
                // height: 'number (optional, default: calculated)',
                // backgroundColor: 'string (optional, default: transparent)'
            }
        },
        returns: 'PNG image buffer with all unique cards arranged in rows of 7'
    })
}
