// Image processing utilities for deck PNG generation
// This file contains logic for downloading, resizing, and preparing card images

import {
    CardItem,
    SortOption,
    SortDirection,
    SORT_OPTION
} from '@/app/types/api'
import { CardImageBuffer } from '../_types'

/**
 * Sort cards for image processing
 * Removes invalid cards and sorts by CMC then by name
 */
export function sortCards(
    cards: CardItem[],
    sortBy?: SortOption,
    sortDirection?: SortDirection
): CardItem[] {
    return cards.sort((a, b) => {
        const key = sortBy && SORT_OPTION.includes(sortBy) ? sortBy : 'name'
        const direction = sortDirection === 'desc' ? -1 : 1
        if (sortBy === 'rarity') {
            const rarityOrder = ['common', 'uncommon', 'rare', 'mythic']
            return (
                (rarityOrder.indexOf(a.rarity) -
                    rarityOrder.indexOf(b.rarity)) *
                direction
            )
        } else if (sortBy === 'colors') {
            const colorOrder = ['W', 'U', 'B', 'R', 'G', 'multi', 'colorless']
            const aColor = a.colors?.length
                ? a.colors.length > 1
                    ? 'multi'
                    : a.colors[0]
                : 'colorless'
            const bColor = b.colors?.length
                ? b.colors.length > 1
                    ? 'multi'
                    : b.colors[0]
                : 'colorless'
            return (
                (colorOrder.indexOf(aColor) - colorOrder.indexOf(bColor)) *
                direction
            )
        } else {
            const sortKeyA = a[key]
            const sortKeyB = b[key]
            if (sortKeyA < sortKeyB) return -1 * direction
            if (sortKeyA > sortKeyB) return 1 * direction
            return 0
        }
    })
}

/**
 * Calculate layout metrics for the image grid
 */
export function calculateLayoutMetrics(
    successfulImages: CardImageBuffer[],
    cardsPerRow: number
): {
    mainImages: CardImageBuffer[]
    sideboardImages: CardImageBuffer[]
    totalMainRows: number
    totalSideboardRows: number
    hasSideboard: boolean
} {
    const mainImages = successfulImages.filter((img) => img.groupId === 0)
    const sideboardImages = successfulImages.filter((img) => img.groupId !== 0)

    const hasSideboard = sideboardImages.length > 0
    const totalMainRows = Math.ceil(mainImages.length / cardsPerRow)
    const totalSideboardRows = hasSideboard
        ? Math.ceil(sideboardImages.length / cardsPerRow)
        : 0

    return {
        mainImages,
        sideboardImages,
        totalMainRows,
        totalSideboardRows,
        hasSideboard
    }
}
