import { ScryfallCard } from './scryfall'

// cards API types and constants
export interface CardItem {
    id: ScryfallCard['id']
    name: ScryfallCard['name']
    cmc: ScryfallCard['cmc']
    typeLine: ScryfallCard['type_line']
    rarity: ScryfallCard['rarity']
    image_uri: string | null
    colors: ScryfallCard['colors']
    legalities: ScryfallCard['legalities']
    quantity: number // Number of copies of the card
    groupId: number // Unique identifier for grouping cards in sections (e.g. main deck, sideboard)
}

export interface CardsResponse {
    cards: CardItem[]
    errors: string[]
}

// deck-png API types and constants
export interface CardImageBuffer {
    name: string
    groupId: number
    buffer: Buffer | null
    quantity: number
}

export type Dimensions = {
    width: number
    height: number
    original?: {
        width: number
        height: number
    }
    scale?: number
}

export type Modifiers = {
    topModifier?: number
    leftModifier?: number
    rightModifier?: number
    bottomModifier?: number
}

export type ProgressCallback = (
    _current: number,
    _total: number,
    _cardName: string
) => void

// Centralized definitions for options and types used in the deck PNG generation process
export const SORT_OPTION = [
    'name',
    'cmc',
    'typeLine',
    'colors',
    'rarity'
] as const

export const SORT_DIRECTION = ['asc', 'desc'] as const

export const FILE_TYPE = ['png', 'jpeg', 'webp'] as const

export const IMAGE_SIZE = [
    'ig_square',
    'ig_story',
    'ig_portrait',
    'ig_landscape',
    'facebook_post',
    'facebook_cover',
    'twitter_post',
    'twitter_header',
    'tiktok_post'
] as const

export const IMAGE_VARIANT = ['grid', 'spoiler', 'stacks'] as const

export const IMAGE_RESOLUTION = ['standard', 'high'] as const

export const BACKGROUND_STYLE = [
    'transparent',
    'white',
    'custom_color',
    'custom_image'
] as const

export const SCRYFALL_FORMAT = [
    'standard',
    // "future",
    'historic',
    'timeless',
    'gladiator',
    'pioneer',
    'modern',
    'legacy',
    'pauper',
    'vintage',
    // "penny",
    'commander',
    // "oathbreaker",
    'standardbrawl',
    'brawl',
    'alchemy',
    'paupercommander',
    'duel',
    'oldschool',
    'premodern',
    'predh'
] as const

export type SortOption = (typeof SORT_OPTION)[number]
export type SortDirection = (typeof SORT_DIRECTION)[number]
export type FileType = (typeof FILE_TYPE)[number]
export type ImageSize = (typeof IMAGE_SIZE)[number]
export type ImageVariant = (typeof IMAGE_VARIANT)[number]
export type ImageResolution = (typeof IMAGE_RESOLUTION)[number]
export type BackgroundStyle = (typeof BACKGROUND_STYLE)[number]
export type Format = (typeof SCRYFALL_FORMAT)[number]

export interface DeckPngOptions {
    sortBy?: SortOption
    sortDirection?: SortDirection
    fileType?: FileType
    imageSize?: ImageSize
    imageVariant?: ImageVariant
    imageResolution?: ImageResolution
    backgroundStyle?: BackgroundStyle
    customBackgroundColor?: string // Hex color for custom background
    customBackgroundImage?: string // Base64 encoded image for custom background
    includeCardCount?: boolean
}

export interface DeckPngRequest {
    cards: CardItem[]
    options?: DeckPngOptions
}

export interface ProgressInfo {
    current: number
    total: number
    message: string
    percentage: number
}
