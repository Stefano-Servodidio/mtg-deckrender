import { CircularCache } from './circularCache'

// Create a singleton instance for overlay caching
export const overlayCache = new CircularCache<Buffer>(50)
export const collectionCardCache = new CircularCache<{
    expires: number
    data: any
}>(500)
