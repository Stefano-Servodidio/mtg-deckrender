import { CardItem } from '../cards/_types'

export interface DeckPngRequest {
    cards: CardItem[]
    options?: {
        rowSize?: number
    }
}

export interface CardImageBuffer {
    name: string
    type: 'main' | 'sideboard'
    buffer: Buffer
    quantity: number
}
