import { serverlessFetcher } from '.'
import useSWR, { SWRConfiguration } from 'swr'
import { ScryfallCard } from '../scryfall/types'
import { CardsResponse } from './types'

export const useCards = (
    decklist: string | null,
    config?: SWRConfiguration
) => {
    const { data, error, isLoading } = useSWR(
        decklist && decklist.trim()
            ? [
                  '/api/cards',
                  {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ decklist })
                  }
              ]
            : null,
        serverlessFetcher<CardsResponse>,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            ...config
        }
    )

    return { data, error, isLoading }
}

export const useDeckPng = (
    cards: { card: ScryfallCard; quantity: number }[] | null,
    shouldGenerate: boolean = false,
    config?: SWRConfiguration
) => {
    const { data, error, isLoading } = useSWR(
        cards && cards.length > 0 && shouldGenerate
            ? [
                  '/api/deck-png',
                  {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          accept: 'image/png'
                      },
                      body: JSON.stringify({
                          cards,
                          options: {
                              rowSize: 7
                          }
                      })
                  }
              ]
            : null,
        async ([url, options]) => {
            const res = await fetch(url, options)
            if (!res.ok) {
                throw new Error('Failed to generate deck PNG')
            }
            const blob = await res.blob()
            return URL.createObjectURL(blob)
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            ...config
        }
    )

    return { data, error, isLoading }
}
