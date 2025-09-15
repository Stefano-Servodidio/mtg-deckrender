import { CardItem, CardType } from '../cards/_types'

export enum SORT_OPTION {
    name = 'name',
    cmc = 'cmc',
    typeLine = 'typeLine',
    color = 'color',
    rarity = 'rarity'
}

export enum SORT_DIRECTION {
    asc = 'asc',
    desc = 'desc'
}

export enum FILE_TYPE {
    png = 'png',
    jpeg = 'jpeg',
    webp = 'webp'
}

export enum IMAGE_SIZE {
    small = 'small',
    medium = 'medium',
    large = 'large'
}

export enum IMAGE_VARIANT {
    grid = 'grid',
    spoiler = 'spoiler',
    stacks = 'stacks'
}

export enum IMAGE_ORIENTATION {
    vertical = 'vertical',
    horizontal = 'horizontal'
}

export enum BACKGROUND_STYLE {
    transparent = 'transparent',
    white = 'white',
    custom = 'custom'
}

export enum SCRYFALL_FORMAT {
    standard = 'standard',
    // future = 'future',
    historic = 'historic',
    timeless = 'timeless',
    gladiator = 'gladiator',
    pioneer = 'pioneer',
    modern = 'modern',
    legacy = 'legacy',
    pauper = 'pauper',
    vintage = 'vintage',
    // penny = 'penny',
    commander = 'commander',
    // oathbreaker = 'oathbreaker',
    standardbrawl = 'standardbrawl',
    brawl = 'brawl',
    alchemy = 'alchemy',
    paupercommander = 'paupercommander',
    duel = 'duel',
    oldschool = 'oldschool',
    premodern = 'premodern',
    predh = 'predh'
}

export type SortOption = keyof typeof SORT_OPTION
export type SortDirection = keyof typeof SORT_DIRECTION
export type FileType = keyof typeof FILE_TYPE
export type ImageSize = keyof typeof IMAGE_SIZE
export type ImageVariant = keyof typeof IMAGE_VARIANT
export type ImageOrientation = keyof typeof IMAGE_ORIENTATION
export type BackgroundStyle = keyof typeof BACKGROUND_STYLE
export type Format = keyof typeof SCRYFALL_FORMAT

export interface DeckPngRequest {
    cards: CardItem[]
    options?: {
        rowSize?: number
        sortBy?: SortOption
        sortDirection?: SortDirection
        fileType?: FileType
        imageSize?: ImageSize
        imageVariant?: ImageVariant
        imageOrientation?: ImageOrientation
        backgroundStyle?: BackgroundStyle
        customBackground?: string
        mtgFormat?: Format | null
        includeCardCount?: boolean
    }
}

export interface CardImageBuffer {
    name: string
    type: CardType
    buffer: Buffer
    quantity: number
}
