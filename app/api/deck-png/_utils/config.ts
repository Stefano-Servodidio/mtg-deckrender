// Configuration file for deck PNG generation dimensions and settings
// This centralizes all layout calculations and makes them human-readable

import { ImageSize } from '@/app/types/api'
import { Dimensions } from '../_types'

export const DECK_LAYOUT_CONFIG = {
    // Base card dimensions (from Scryfall small images)
    card: {
        baseWidth: 745, // PNG image width from Scryfall
        baseHeight: 1040 // PNG image height from Scryfall
    },

    // Layout spacing
    spacing: {
        betweenCards: 0, // Space between individual cards
        sideboardSeparator: 70, // Extra space before sideboard section
        canvasPadding: 20 // Padding around the entire canvas (using spacing value)
    },

    // Row configuration
    row: {
        heightMultiplier: {
            default: 1.0,
            grid: 0.4, // For grid variant: row height = cardHeight * this (50% overlap)
            spoiler: 1.0, // For visual spoiler: no overlap
            stacks: 1.0 // For stacks: no overlap
        }
    },

    // Quantity overlay settings
    overlay: {
        offsetFromRight: 210, // Distance from right edge of card
        offsetFromTop: 140 // Distance from top edge of card
    }
} as const

export const CANVAS_SIZE: Record<ImageSize, Dimensions> = {
    ig_square: { width: 1080, height: 1080 },
    ig_story: { width: 1080, height: 1920 },
    ig_portrait: { width: 1080, height: 1350 },
    ig_landscape: { width: 1080, height: 566 },
    facebook_post: { width: 1200, height: 630 },
    facebook_cover: { width: 820, height: 312 },
    twitter_post: { width: 1200, height: 675 },
    twitter_header: { width: 1500, height: 500 },
    tiktok_post: { width: 1080, height: 1920 }
} as const

export const ROW_SIZE: Record<ImageSize, number> = {
    ig_square: 7,
    ig_story: 6,
    ig_portrait: 7,
    ig_landscape: 12,
    facebook_post: 7,
    facebook_cover: 12,
    twitter_post: 7,
    twitter_header: 12,
    tiktok_post: 6
}
