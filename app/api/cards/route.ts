import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        // decklist is a string with one card name per line
        const { decklist } = await request.json()

        if (!decklist || typeof decklist !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request. Expected decklist to be a string.' },
                { status: 400 }
            )
        }

        // Parse decklist into unique card names with quantities
        const cardStrings = decklist.split('\n').map((line) => line.trim())

        const uniqueCards = cardStrings.reduce<
            { name: string; quantity: number }[]
        >((acc, line) => {
            if (!line) {
                return acc
            }
            const [quantityStr, name] = line.split('#')
            const quantity = parseInt(quantityStr.replace('x', ''), 10)
            if (!isNaN(quantity) && quantity > 0 && name) {
                acc.push({ name, quantity })
            }
            return acc
        }, [])

        if (!uniqueCards.length) {
            return NextResponse.json(
                { error: 'No valid cards found in the decklist.' },
                { status: 400 }
            )
        }

        const cards = []
        // Fetch card data from Scryfall for each unique card
        for (const { name } of uniqueCards) {
            const card = await fetch(
                process.env.NEXT_PUBLIC_API_URL_SCRYFALL +
                    `cards/named?fuzzy=${encodeURIComponent(name)}`,
                {
                    method: 'GET',
                    headers: {
                        'User-Agent':
                            process.env.NEXT_PUBLIC_API_USER_AGENT ||
                            'mtg-deck-to-png/1.0'
                    }
                }
            )
            if (!card.ok) {
                return NextResponse.json(
                    { error: `Card not found: ${name}` },
                    { status: 404 }
                )
            }
            const cardData = await card.json()
            cards.push(cardData)
            await sleep(60) // Sleep for 100ms to respect rate limits
        }

        return NextResponse.json({ cards })
    } catch (error) {
        console.error('Error fetching card images:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET() {
    return NextResponse.json({
        message: 'Card Images API',
        usage: 'POST with { "decklist": "4x Card Name 1\n4x Card Name 2" }',
        description:
            'Fetches card information and images for the provided text decklist.'
    })
}
