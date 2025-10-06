import { describe, it, expect, beforeEach } from 'vitest'
import { CircularCache } from '../circularCache'

describe('CircularCache', () => {
    let cache: CircularCache<number>

    beforeEach(() => {
        cache = new CircularCache<number>(3)
    })

    it('should set and get values', () => {
        cache.set('a', 1)
        expect(cache.get('a')).toBe(1)
    })

    it('should return undefined for missing keys', () => {
        expect(cache.get('missing')).toBeUndefined()
    })

    it('should update value for existing key without changing order', () => {
        cache.set('a', 1)
        cache.set('b', 2)
        cache.set('a', 42)
        expect(cache.get('a')).toBe(42)
        expect(cache.getKeys()).toEqual(['a', 'b'])
    })

    it('should evict oldest key when maxSize exceeded', () => {
        cache.set('a', 1)
        cache.set('b', 2)
        cache.set('c', 3)
        cache.set('d', 4) // should evict 'a'
        expect(cache.get('a')).toBeUndefined()
        expect(cache.get('b')).toBe(2)
        expect(cache.get('c')).toBe(3)
        expect(cache.get('d')).toBe(4)
        expect(cache.getKeys()).toEqual(['b', 'c', 'd'])
    })

    it('should report correct size', () => {
        expect(cache.size()).toBe(0)
        cache.set('a', 1)
        expect(cache.size()).toBe(1)
        cache.set('b', 2)
        expect(cache.size()).toBe(2)
    })

    it('should clear all entries', () => {
        cache.set('a', 1)
        cache.set('b', 2)
        cache.clear()
        expect(cache.size()).toBe(0)
        expect(cache.getKeys()).toEqual([])
        expect(cache.get('a')).toBeUndefined()
    })

    it('should check existence of keys', () => {
        cache.set('a', 1)
        expect(cache.has('a')).toBe(true)
        expect(cache.has('b')).toBe(false)
    })

    it('should delete specific key', () => {
        cache.set('a', 1)
        cache.set('b', 2)
        const deleted = cache.delete('a')
        expect(deleted).toBe(true)
        expect(cache.get('a')).toBeUndefined()
        expect(cache.getKeys()).toEqual(['b'])
        expect(cache.size()).toBe(1)
    })

    it('should return false when deleting non-existent key', () => {
        expect(cache.delete('missing')).toBe(false)
    })

    it('should maintain insertion order in getKeys()', () => {
        cache.set('x', 10)
        cache.set('y', 20)
        cache.set('z', 30)
        expect(cache.getKeys()).toEqual(['x', 'y', 'z'])
    })
})
