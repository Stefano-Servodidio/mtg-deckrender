/* eslint-disable unused-imports/no-unused-vars */
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

export type ProgressCallback = (
    current: number,
    total: number,
    cardName: string
) => void
