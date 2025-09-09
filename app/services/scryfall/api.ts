import { scryfallFetcher } from '.'
import useSWR from 'swr'
import { ScryfallCard } from './types'

export interface UseScryfallCardNamedResult {
    card: ScryfallCard | null
    isLoading: boolean
    isError: any
}

export function useScryfallCardNamed(name: string): UseScryfallCardNamedResult {
    const { data, error, isLoading } = useSWR(
        `cards/named?fuzzy=${encodeURIComponent(name)}`,
        scryfallFetcher<ScryfallCard>
    )

    return {
        card: data || null,
        isLoading,
        isError: error
    }
}
