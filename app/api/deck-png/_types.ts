export interface CardImageBuffer {
    name: string
    groupId: number
    buffer: Buffer
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
