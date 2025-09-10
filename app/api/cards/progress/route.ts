import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { decklist } = await request.json()

        if (!decklist || typeof decklist !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request. Expected decklist to be a string.' },
                { status: 400 }
            )
        }

        // Parse decklist into unique card names with quantities
        const cardStrings = decklist
            .split('\n')
            .map((line) => line.replace(' ', '#').trim())

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

        // Create a readable stream for Server-Sent Events
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                const cards = []
                const errors = []
                const totalCards = uniqueCards.length

                // Send initial progress
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: 'progress',
                            current: 0,
                            total: totalCards,
                            percentage: 0,
                            message: 'Starting to fetch cards...'
                        })}\n\n`
                    )
                )

                // Fetch card data from Scryfall for each unique card
                for (let i = 0; i < uniqueCards.length; i++) {
                    const { name, quantity } = uniqueCards[i]
                    
                    try {
                        // Send progress update
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    type: 'progress',
                                    current: i + 1,
                                    total: totalCards,
                                    percentage: Math.round(((i + 1) / totalCards) * 100),
                                    message: `Fetching ${name}...`
                                })}\n\n`
                            )
                        )

                        const response = await fetch(
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

                        console.log(`Fetching card: ${name}, Status: ${response.status}`)
                        
                        if (!response.ok) {
                            errors.push(name)
                        } else {
                            const cardData = await response.json()
                            cards.push({ card: cardData, quantity })
                        }

                        // Respect rate limits
                        await sleep(60)
                    } catch (error) {
                        console.error(`Error fetching card ${name}:`, error)
                        errors.push(name)
                    }
                }

                // Send completion message
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: 'complete',
                            cards,
                            errors,
                            message: 'All cards fetched successfully!'
                        })}\n\n`
                    )
                )

                controller.close()
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        })
    } catch (error) {
        console.error('Error in progress API:', error)
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
        message: 'Card Progress API',
        usage: 'POST with { "decklist": "4x Card Name 1\\n4x Card Name 2" }',
        description: 'Fetches card information with real-time progress updates via Server-Sent Events.'
    })
}