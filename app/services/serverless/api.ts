import { serverlessFetcher } from '.'
import useSWR from 'swr'

export const useCards = (cardNames: string[]) => {
    const { data, error, isLoading } = useSWR(
        ['/api/cards', { method: 'POST', body: JSON.stringify({ cardNames }) }],
        serverlessFetcher
    )

    return { data, error, isLoading }
}
