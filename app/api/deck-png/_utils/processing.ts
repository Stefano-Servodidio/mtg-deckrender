// Image processing utilities for deck PNG generation
// This file contains logic for downloading, resizing, and preparing card images

import sharp from 'sharp'
import chalk from 'chalk'
import { CardItem } from '../../cards/_types'
import {
    CardImageBuffer,
    SORT_OPTION,
    SortDirection,
    SortOption
} from '../_types'
import { DECK_LAYOUT_CONFIG } from './config'
import { DeckPngOptions } from '@/hooks/useDeckPng'

/**
 * Filter and sort cards for image processing
 * Removes invalid cards and sorts by CMC then by name
 */
export function filterAndSortCards(
    cards: CardItem[],
    sortBy: SortOption,
    sortDirection: SortDirection
): CardItem[] {
    return cards
        .filter(
            (card) => card.image_uri && card.quantity > 0 && card.quantity <= 4
        )
        .sort((a, b) => {
            const key = SORT_OPTION[sortBy] ? SORT_OPTION[sortBy] : 'name'
            const direction = sortDirection === 'desc' ? -1 : 1
            if (sortBy === 'rarity') {
                const rarityOrder = ['common', 'uncommon', 'rare', 'mythic']
                return (
                    (rarityOrder.indexOf(a.rarity) -
                        rarityOrder.indexOf(b.rarity)) *
                    direction
                )
            } else if (sortBy === 'colors') {
                const colorOrder = [
                    'W',
                    'U',
                    'B',
                    'R',
                    'G',
                    'multi',
                    'colorless'
                ]
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
 * Download and resize a single card image
 */
export async function downloadAndResizeCardImage(
    card: CardItem
): Promise<CardImageBuffer | null> {
    const { card: cardConfig } = DECK_LAYOUT_CONFIG

    try {
        const response = await fetch(card.image_uri as string)
        if (!response.ok) {
            throw new Error(`Failed to fetch image for ${card.name}`)
        }

        const buffer = await response.arrayBuffer()
        const resizedBuffer = await sharp(Buffer.from(buffer))
            .resize({
                width: cardConfig.width,
                height: cardConfig.height
            })
            .toBuffer()

        return {
            name: card.name,
            type: card.type,
            buffer: resizedBuffer,
            quantity: card.quantity
        }
    } catch (error) {
        console.error(
            chalk.red(`Error fetching image for ${card.name}:`),
            error
        )
        return null
    }
}

/**
 * Download and resize all card images with progress tracking
 */
export async function downloadAllCardImages(
    cards: CardItem[],
    progressCallback?: (
        current: number,
        total: number,
        cardName: string
    ) => void
): Promise<CardImageBuffer[]> {
    const cardImageBuffers: (CardImageBuffer | null)[] = []
    const totalImages = cards.length

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i]

        if (progressCallback) {
            progressCallback(i + 1, totalImages, card.name)
        }

        const cardBuffer = await downloadAndResizeCardImage(card)
        cardImageBuffers.push(cardBuffer)
    }

    // Filter out failed downloads
    return cardImageBuffers.filter(
        (img): img is CardImageBuffer => img !== null
    )
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
    const mainImages = successfulImages.filter((img) => img.type === 'main')
    const sideboardImages = successfulImages.filter(
        (img) => img.type === 'sideboard'
    )

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
