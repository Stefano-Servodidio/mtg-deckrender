//Scryfall fetcher function
export async function scryfallFetcher<T = unknown>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL_SCRYFALL + url, {
        ...options,
        headers: {
            'User-Agent':
                process.env.NEXT_PUBLIC_API_USER_AGENT || 'mtg-deck-to-png/1.0',
            Accept: 'application/json;q=0.9,*/*;q=0.8',
            ...options.headers
        }
    })
    return await res.json()
}
