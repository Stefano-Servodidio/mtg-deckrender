import { NextRequest, NextResponse } from 'next/server'
import chalk from 'chalk'
import { parseDecklist, getUniqueCards, fetchCardData } from './_utils/decklist'

export async function POST(request: NextRequest) {
    try {
        console.log(chalk.yellow('API: ', chalk.cyan('POST /api/cards')))
        // decklist is a string with one card name per line
        const { decklist } = await request.json()

        if (!decklist || typeof decklist !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request. Expected decklist to be a string.' },
                { status: 400 }
            )
        }

        // Parse the decklist to separate main and sideboard sections
        const { mainString, sideboardString } = parseDecklist(decklist)

        // Parse the decklist to get unique cards and their quantities
        const uniqueCards = [
            ...getUniqueCards(mainString, 'main'),
            ...getUniqueCards(sideboardString, 'sideboard')
        ]
        
        if (!uniqueCards.length) {
            return NextResponse.json(
                { error: 'No valid cards found in the decklist.' },
                { status: 400 }
            )
        }

        // Fetch card data from Scryfall API
        const { cards, errors } = await fetchCardData(uniqueCards)

        return NextResponse.json({ cards, errors })
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
        usage: 'POST with { "decklist": "4x Card Name 1\n4x Card Name 2" }',
        description:
            'Fetches card information and images for the provided text decklist.'
    })
}
