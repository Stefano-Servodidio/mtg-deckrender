import { ScryfallCard } from '../scryfall/types'

export interface CardItem {
    card: ScryfallCard
    id: string
    quantity: number
    type: 'main' | 'sideboard'
}

export interface CardsResponse {
    cards: CardItem[]
    errors: string[]
}
