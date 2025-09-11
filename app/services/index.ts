// API utilities
export async function apiRequest<T = unknown>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    })

    return await response.json()
}
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }