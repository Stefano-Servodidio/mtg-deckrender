//serverless fetcher function
export const serverlessFetcher = async <T = unknown>([url, options]: [
    url: string,
    options: RequestInit
]): Promise<T> => {
    const res = await fetch(url, { ...options })
    return await res.json()
}
