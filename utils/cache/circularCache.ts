/**
 * In-memory circular queue cache with maximum size limit
 */
export class CircularCache<T> {
    private cache = new Map<string, T>()
    private keys: string[] = []
    private maxSize: number

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize
    }

    /**
     * Get value from cache
     */
    get(key: string): T | undefined {
        return this.cache.get(key)
    }

    /**
     * Set value in cache with circular queue eviction
     */
    set(key: string, value: T): void {
        // If key already exists, update it without changing order
        if (this.cache.has(key)) {
            this.cache.set(key, value)
            return
        }

        // If at max capacity, remove oldest key
        if (this.keys.length >= this.maxSize) {
            const oldestKey = this.keys.shift()
            if (oldestKey) {
                this.cache.delete(oldestKey)
            }
        }

        // Add new key-value pair
        this.keys.push(key)
        this.cache.set(key, value)
    }

    /**
     * Check if key exists in cache
     */
    has(key: string): boolean {
        return this.cache.has(key)
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear()
        this.keys = []
    }

    /**
     * Get current cache size
     */
    size(): number {
        return this.cache.size
    }

    /**
     * Get all keys in insertion order
     */
    getKeys(): string[] {
        return [...this.keys]
    }

    /**
     * Delete specific key from cache
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key)
        if (deleted) {
            const index = this.keys.indexOf(key)
            if (index > -1) {
                this.keys.splice(index, 1)
            }
        }
        return deleted
    }
}
