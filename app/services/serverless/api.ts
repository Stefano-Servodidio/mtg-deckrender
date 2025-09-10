import { serverlessFetcher } from '.'
import useSWR, { SWRConfiguration } from 'swr'
import { CardsResponse } from './types'

export const useCards = (decklist: string, config?: SWRConfiguration) => {
    const swr = useSWR(
        decklist?.trim()
            ? [
                  '/api/cards',
                  { method: 'POST', body: JSON.stringify({ decklist }) }
              ]
            : null,
        serverlessFetcher<CardsResponse>,
        config
    )
    console.log('useCards - decklist:', decklist)
    console.log('useCards - swr:', swr)
    console.log('useCards - data:', swr.data)
    console.log('useCards - error:', swr.error)
    console.log('useCards - isLoading:', swr.isLoading)
    return swr
}
