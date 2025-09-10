import { ScryfallCard } from '../scryfall/types'

export interface CardsResponse {
    cards: ScryfallCard[]
    errors: string[]
}
