import { serverlessFetcher } from '.'
import useSWR, { SWRConfiguration } from 'swr'
import { ScryfallCard } from '../scryfall/types'

export const useCards = (decklist: string, config?: SWRConfiguration) => {
    const { data, error, isLoading } = useSWR(
        decklist?.trim()
            ? [
                  '/api/cards',
                  { method: 'POST', body: JSON.stringify({ decklist }) }
              ]
            : null,
        serverlessFetcher<{ cards: ScryfallCard[] }>,
        config
    )

    return { data, error, isLoading }
}
