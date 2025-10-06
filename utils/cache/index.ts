import { CardImageBuffer, CardItem } from '@/types/api'
import { CircularCache } from './circularCache'

// Create a singleton instance for overlay caching
export const overlayCache = new CircularCache<Buffer>(200)

export const cardImageCache = new CircularCache<CardImageBuffer>(200)

export const cardCache = new CircularCache<{
    expires: number
    data: CardItem
}>(1000)
export const collectionCardCache = new CircularCache<{
    expires: number
    data: CardItem
}>(1000)
