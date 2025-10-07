import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { isMaintenanceMode, maintenanceResponse } from '../maintenance'

describe('Maintenance utilities', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        originalEnv = process.env
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    describe('isMaintenanceMode', () => {
        test('should return true when NEXT_PUBLIC_MAINTENANCE is "true"', () => {
            process.env.NEXT_PUBLIC_MAINTENANCE = 'true'
            expect(isMaintenanceMode()).toBe(true)
        })

        test('should return false when NEXT_PUBLIC_MAINTENANCE is not set', () => {
            delete process.env.NEXT_PUBLIC_MAINTENANCE
            expect(isMaintenanceMode()).toBe(false)
        })

        test('should return false when NEXT_PUBLIC_MAINTENANCE is "false"', () => {
            process.env.NEXT_PUBLIC_MAINTENANCE = 'false'
            expect(isMaintenanceMode()).toBe(false)
        })

        test('should return false when NEXT_PUBLIC_MAINTENANCE is any other value', () => {
            process.env.NEXT_PUBLIC_MAINTENANCE = 'yes'
            expect(isMaintenanceMode()).toBe(false)
        })
    })

    describe('maintenanceResponse', () => {
        test('should return 503 status', async () => {
            const response = maintenanceResponse()
            expect(response.status).toBe(503)
        })

        test('should return correct error message', async () => {
            const response = maintenanceResponse()
            const data = await response.json()
            expect(data).toEqual({
                error: 'Service Unavailable - Maintenance mode'
            })
        })
    })
})
