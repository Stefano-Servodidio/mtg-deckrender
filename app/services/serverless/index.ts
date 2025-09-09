//serverless fetcher function
export async function serverlessFetcher<T = unknown>([url, options]: [
    url: string,
    options: RequestInit
]): Promise<T> {
    const res = await fetch(url, { ...options })
    return await res.json()
}
