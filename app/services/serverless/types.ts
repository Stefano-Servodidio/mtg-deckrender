import { ScryfallCard } from '../scryfall/types'

export interface UniqueCard {
    id: string
    card: ScryfallCard
    quantity: number
}
export interface CardsResponse {
    cards: UniqueCard[]
    errors: string[]
}
