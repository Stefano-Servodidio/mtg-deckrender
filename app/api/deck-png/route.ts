import { NextRequest, NextResponse } from 'next/server'
import { ScryfallCard } from '@/app/services/scryfall/types'

interface DeckCard {
    card: ScryfallCard
    quantity: number
}

interface DeckPngRequest {
    cards: DeckCard[]
    options?: {
        format?: 'PNG' | 'JPEG'
        width?: number
        height?: number
        backgroundColor?: string
        textColor?: string
    }
}

interface CardImageData {
    name: string
    quantity: number
    imageUri: string
    manaCost?: string
    typeLine?: string
    rarity?: string
}

export async function POST(request: NextRequest) {
    try {
        const { cards, options = {} }: DeckPngRequest = await request.json()

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
        const cardImages: CardImageData[] = cards.map(({ card, quantity }) => ({
            name: card.name,
            quantity,
            imageUri: card.image_uris?.small || '',
            manaCost: card.mana_cost || '',
            typeLine: card.type_line || '',
            rarity: card.rarity || 'common'
        }))

        // Filter out cards without image URIs
        const validCardImages = cardImages.filter(card => card.imageUri)
        const invalidCards = cardImages.filter(card => !card.imageUri)

        if (validCardImages.length === 0) {
            return NextResponse.json(
                { error: 'No valid card images found.' },
                { status: 400 }
            )
        }

        // Calculate totals
        const totalCards = validCardImages.reduce((sum, card) => sum + card.quantity, 0)
        
        // Group cards by type for better organization
        const groupedCards = {
            creatures: validCardImages.filter(card => 
                card.typeLine.toLowerCase().includes('creature')
            ),
            spells: validCardImages.filter(card => 
                card.typeLine.toLowerCase().includes('instant') ||
                card.typeLine.toLowerCase().includes('sorcery')
            ),
            artifacts: validCardImages.filter(card => 
                card.typeLine.toLowerCase().includes('artifact')
            ),
            enchantments: validCardImages.filter(card => 
                card.typeLine.toLowerCase().includes('enchantment')
            ),
            planeswalkers: validCardImages.filter(card => 
                card.typeLine.toLowerCase().includes('planeswalker')
            ),
            lands: validCardImages.filter(card => 
                card.typeLine.toLowerCase().includes('land')
            ),
            other: validCardImages.filter(card => {
                const type = card.typeLine.toLowerCase()
                return !type.includes('creature') &&
                       !type.includes('instant') &&
                       !type.includes('sorcery') &&
                       !type.includes('artifact') &&
                       !type.includes('enchantment') &&
                       !type.includes('planeswalker') &&
                       !type.includes('land')
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Card images processed successfully',
            data: {
                cardImages: validCardImages,
                groupedCards,
                totalCards,
                totalUniqueCards: validCardImages.length,
                invalidCards: invalidCards.map(card => card.name),
                options: {
                    format: options.format || 'PNG',
                    width: options.width || 800,
                    height: options.height || 1000,
                    backgroundColor: options.backgroundColor || '#ffffff',
                    textColor: options.textColor || '#000000'
                }
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
        description: 'Processes Magic: The Gathering cards and returns their image URIs organized for deck visualization',
        expectedFormat: {
            cards: [
                {
                    card: 'ScryfallCard object with image_uris',
                    quantity: 'number'
                }
            ],
            options: {
                format: 'PNG | JPEG (optional)',
                width: 'number (optional, default: 800)',
                height: 'number (optional, default: 1000)',
                backgroundColor: 'string (optional, default: #ffffff)',
                textColor: 'string (optional, default: #000000)'
            }
        },
        returns: {
            cardImages: 'Array of card data with image URIs',
            groupedCards: 'Cards organized by type',
            totalCards: 'Total number of cards including quantities',
            totalUniqueCards: 'Number of unique cards',
            invalidCards: 'Array of card names without valid images'
        }
    })
}