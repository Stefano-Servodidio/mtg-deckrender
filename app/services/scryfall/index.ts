// Scryfall API utilities
export const SCRYFALL_API_BASE = process.env.NEXT_PUBLIC_API_URL_SCRYFALL || 'https://api.scryfall.com/'
export const USER_AGENT = process.env.NEXT_PUBLIC_API_USER_AGENT || 'mtg-deck-to-png/1.0'

export async function fetchFromScryfall<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${SCRYFALL_API_BASE}${endpoint}`
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json;q=0.9,*/*;q=0.8',
            ...options.headers
        }
    })

    if (!response.ok) {
        throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
}