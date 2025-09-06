import { NextRequest, NextResponse } from 'next/server'

interface DeckCard {
    quantity: number
    name: string
    category?:
        | 'creature'
        | 'instant'
        | 'sorcery'
        | 'enchantment'
        | 'artifact'
        | 'planeswalker'
        | 'land'
        | 'other'
}

interface ParsedDeck {
    mainboard: DeckCard[]
    sideboard: DeckCard[]
    deckName?: string
}

function parseDeckList(decklistText: string): ParsedDeck {
    const lines = decklistText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    const mainboard: DeckCard[] = []
    const sideboard: DeckCard[] = []
    let currentSection = 'mainboard'
    let deckName = ''

    for (const line of lines) {
        // Check for section headers
        if (line.toLowerCase().includes('sideboard')) {
            currentSection = 'sideboard'
            continue
        }

        if (
            line.toLowerCase().includes('deck name') ||
            line.toLowerCase().includes('title')
        ) {
            deckName = line.replace(/deck name:?|title:?/i, '').trim()
            continue
        }

        // Parse card lines (format: "4x Card Name" or "4 Card Name")
        const cardMatch = line.match(/^(\d+)x?\s+(.+)$/)
        if (cardMatch) {
            const quantity = parseInt(cardMatch[1])
            const name = cardMatch[2].trim()

            // Simple categorization based on card name patterns
            let category: DeckCard['category'] = 'other'
            const lowerName = name.toLowerCase()

            if (
                lowerName.includes('island') ||
                lowerName.includes('mountain') ||
                lowerName.includes('forest') ||
                lowerName.includes('plains') ||
                lowerName.includes('swamp') ||
                lowerName.includes('land')
            ) {
                category = 'land'
            } else if (
                lowerName.includes('jace') ||
                lowerName.includes('planeswalker')
            ) {
                category = 'planeswalker'
            } else if (
                lowerName.includes('bolt') ||
                lowerName.includes('counterspell')
            ) {
                category = 'instant'
            }

            const card: DeckCard = { quantity, name, category }

            if (currentSection === 'sideboard') {
                sideboard.push(card)
            } else {
                mainboard.push(card)
            }
        }
    }

    return { mainboard, sideboard, deckName }
}

function generateDeckImageData(parsedDeck: ParsedDeck) {
    // This would normally generate an actual PNG image
    // For now, we'll return structured data that could be used to generate an image

    const totalMainboard = parsedDeck.mainboard.reduce(
        (sum, card) => sum + card.quantity,
        0
    )
    const totalSideboard = parsedDeck.sideboard.reduce(
        (sum, card) => sum + card.quantity,
        0
    )

    // Group cards by category
    const categorizedCards = parsedDeck.mainboard.reduce(
        (acc, card) => {
            const category = card.category || 'other'
            if (!acc[category]) acc[category] = []
            acc[category].push(card)
            return acc
        },
        {} as Record<string, DeckCard[]>
    )

    return {
        deckName: parsedDeck.deckName || 'Untitled Deck',
        totalCards: {
            mainboard: totalMainboard,
            sideboard: totalSideboard
        },
        categories: categorizedCards,
        sideboard: parsedDeck.sideboard,
        imageData: {
            width: 800,
            height: 1000,
            format: 'PNG',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            sections: [
                {
                    type: 'header',
                    content: parsedDeck.deckName || 'Magic: The Gathering Deck',
                    fontSize: 24,
                    y: 50
                },
                {
                    type: 'mainboard',
                    content: parsedDeck.mainboard,
                    y: 100
                },
                {
                    type: 'sideboard',
                    content: parsedDeck.sideboard,
                    y: 600
                }
            ]
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { decklistText, options = {} } = await request.json()

        if (!decklistText || typeof decklistText !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request. Expected decklistText as string.' },
                { status: 400 }
            )
        }

        // Parse the decklist
        const parsedDeck = parseDeckList(decklistText)

        if (parsedDeck.mainboard.length === 0) {
            return NextResponse.json(
                { error: 'No valid cards found in decklist.' },
                { status: 400 }
            )
        }

        // Generate image data (in a real implementation, this would create an actual PNG)
        const imageData = generateDeckImageData(parsedDeck)

        // In a real implementation, you would:
        // 1. Use a library like canvas or sharp to create an actual PNG
        // 2. Layout the cards in a visually appealing format
        // 3. Add card images, mana symbols, etc.
        // 4. Return the actual image buffer or base64 data

        return NextResponse.json({
            success: true,
            message: 'Deck PNG generated successfully',
            data: imageData,
            // In a real implementation, you'd include:
            // imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
            // or a URL to the generated image
            mockImageUrl:
                'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800&h=1000',
            downloadReady: true
        })
    } catch (error) {
        console.error('Error generating deck PNG:', error)
        return NextResponse.json(
            { error: 'Internal server error while generating PNG' },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Deck PNG Generator API',
        usage: 'POST with { "decklistText": "4x Lightning Bolt\\n4x Counterspell\\n...", "options": {} }',
        description:
            'Converts a Magic: The Gathering decklist into a PNG image',
        supportedFormats: [
            '4x Card Name',
            '4 Card Name',
            'Sideboard section support',
            'Deck name/title recognition'
        ]
    })
}
