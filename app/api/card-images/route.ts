import { NextRequest, NextResponse } from 'next/server'

// Mock card database - in a real app, this would connect to Scryfall API or similar
const MOCK_CARDS = {
    'lightning bolt': {
        name: 'Lightning Bolt',
        mana_cost: '{R}',
        type_line: 'Instant',
        oracle_text: 'Lightning Bolt deals 3 damage to any target.',
        image_url:
            'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    counterspell: {
        name: 'Counterspell',
        mana_cost: '{U}{U}',
        type_line: 'Instant',
        oracle_text: 'Counter target spell.',
        image_url:
            'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    'jace, the mind sculptor': {
        name: 'Jace, the Mind Sculptor',
        mana_cost: '{2}{U}{U}',
        type_line: 'Legendary Planeswalker — Jace',
        oracle_text: "+2: Look at the top card of target player's library...",
        image_url:
            'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    island: {
        name: 'Island',
        mana_cost: '',
        type_line: 'Basic Land — Island',
        oracle_text: '{T}: Add {U}.',
        image_url:
            'https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
}

export async function POST(request: NextRequest) {
    try {
        const { cardNames } = await request.json()

        if (!cardNames || !Array.isArray(cardNames)) {
            return NextResponse.json(
                { error: 'Invalid request. Expected array of card names.' },
                { status: 400 }
            )
        }

        const cardData = cardNames.map((cardName) => {
            const normalizedName = cardName.toLowerCase().trim()
            const card = MOCK_CARDS[normalizedName as keyof typeof MOCK_CARDS]

            if (card) {
                return {
                    name: cardName,
                    found: true,
                    ...card
                }
            } else {
                return {
                    name: cardName,
                    found: false,
                    error: 'Card not found'
                }
            }
        })

        return NextResponse.json({ cards: cardData })
    } catch (error) {
        console.error('Error fetching card images:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Card Images API',
        usage: 'POST with { "cardNames": ["Card Name 1", "Card Name 2"] }',
        description:
            'Fetches card information and images for the provided card names'
    })
}
