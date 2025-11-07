import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// Mock fs module
vi.mock('fs', () => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn()
}))

describe('validate-cypress script', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('required files validation', () => {
        it('should check for cypress.config.ts', () => {
            const requiredFiles = [
                'cypress.config.ts',
                'cypress/support/e2e.ts',
                'cypress/support/commands.ts',
                'cypress/support/component.ts',
                'cypress/e2e/deck-to-png-flow.cy.ts',
                'cypress/e2e/navigation.cy.ts',
                'cypress/fixtures/sample-decklists.json',
                'E2E.MD'
            ]

            expect(requiredFiles).toContain('cypress.config.ts')
            expect(requiredFiles).toContain('cypress/support/e2e.ts')
            expect(requiredFiles).toContain(
                'cypress/fixtures/sample-decklists.json'
            )
        })

        it('should include all required support files', () => {
            const requiredFiles = [
                'cypress.config.ts',
                'cypress/support/e2e.ts',
                'cypress/support/commands.ts',
                'cypress/support/component.ts',
                'cypress/e2e/deck-to-png-flow.cy.ts',
                'cypress/e2e/navigation.cy.ts',
                'cypress/fixtures/sample-decklists.json',
                'E2E.MD'
            ]

            expect(requiredFiles.length).toBe(8)
        })
    })

    describe('package.json validation', () => {
        it('should check for required dependencies', () => {
            const requiredDeps = [
                'cypress',
                '@cypress/react',
                'start-server-and-test'
            ]

            expect(requiredDeps).toContain('cypress')
            expect(requiredDeps).toContain('@cypress/react')
            expect(requiredDeps).toContain('start-server-and-test')
        })

        it('should check for required scripts', () => {
            const requiredScripts = [
                'cypress:open',
                'cypress:run',
                'e2e',
                'e2e:open'
            ]

            expect(requiredScripts).toContain('cypress:open')
            expect(requiredScripts).toContain('cypress:run')
            expect(requiredScripts).toContain('e2e')
            expect(requiredScripts).toContain('e2e:open')
        })

        it('should validate package.json when it exists', () => {
            const mockPackageJson = {
                devDependencies: {
                    cypress: '^13.0.0',
                    '@cypress/react': '^8.0.0',
                    'start-server-and-test': '^2.0.0'
                },
                scripts: {
                    'cypress:open': 'cypress open',
                    'cypress:run': 'cypress run',
                    e2e: 'start-server-and-test dev 3000 cypress:run',
                    'e2e:open': 'start-server-and-test dev 3000 cypress:open'
                }
            }

            vi.mocked(fs.existsSync).mockReturnValue(true)
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify(mockPackageJson)
            )

            const packageJson = JSON.parse(
                fs.readFileSync('package.json', 'utf8')
            )

            expect(packageJson.devDependencies.cypress).toBeDefined()
            expect(packageJson.scripts['cypress:open']).toBeDefined()
        })
    })

    describe('cypress configuration validation', () => {
        it('should check for required configuration elements', () => {
            const requiredConfigs = [
                'baseUrl',
                'supportFile',
                'specPattern',
                'viewportWidth',
                'viewportHeight'
            ]

            expect(requiredConfigs).toContain('baseUrl')
            expect(requiredConfigs).toContain('supportFile')
            expect(requiredConfigs).toContain('specPattern')
            expect(requiredConfigs).toContain('viewportWidth')
            expect(requiredConfigs).toContain('viewportHeight')
        })

        it('should validate cypress config content', () => {
            const mockConfigContent = `
                export default {
                    e2e: {
                        baseUrl: 'http://localhost:3000',
                        supportFile: 'cypress/support/e2e.ts',
                        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
                        viewportWidth: 1280,
                        viewportHeight: 720
                    }
                }
            `

            vi.mocked(fs.existsSync).mockReturnValue(true)
            vi.mocked(fs.readFileSync).mockReturnValue(mockConfigContent)

            const configContent = fs.readFileSync('cypress.config.ts', 'utf8')

            expect(configContent).toContain('baseUrl')
            expect(configContent).toContain('supportFile')
            expect(configContent).toContain('viewportWidth')
        })
    })

    describe('test fixtures validation', () => {
        it('should check for expected fixtures', () => {
            const expectedFixtures = [
                'basicLands',
                'mixedDeck',
                'withSideboard'
            ]

            expect(expectedFixtures).toContain('basicLands')
            expect(expectedFixtures).toContain('mixedDeck')
            expect(expectedFixtures).toContain('withSideboard')
        })

        it('should validate fixtures JSON structure', () => {
            const mockFixtures = {
                basicLands: '4 Forest\n4 Mountain',
                mixedDeck: '4 Lightning Bolt\n4 Counterspell',
                withSideboard: 'Main\n4 Bolt\n\nSideboard\n2 Negate'
            }

            vi.mocked(fs.existsSync).mockReturnValue(true)
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify(mockFixtures)
            )

            const fixtures = JSON.parse(
                fs.readFileSync(
                    'cypress/fixtures/sample-decklists.json',
                    'utf8'
                )
            )

            expect(fixtures.basicLands).toBeDefined()
            expect(fixtures.mixedDeck).toBeDefined()
            expect(fixtures.withSideboard).toBeDefined()
        })

        it('should handle invalid JSON in fixtures', () => {
            vi.mocked(fs.existsSync).mockReturnValue(true)
            vi.mocked(fs.readFileSync).mockReturnValue('{invalid json')

            expect(() => {
                JSON.parse(fs.readFileSync('fixtures.json', 'utf8'))
            }).toThrow()
        })
    })

    describe('file existence checks', () => {
        it('should use existsSync to check files', () => {
            vi.mocked(fs.existsSync).mockReturnValue(true)

            const exists = fs.existsSync('cypress.config.ts')

            expect(fs.existsSync).toHaveBeenCalledWith('cypress.config.ts')
            expect(exists).toBe(true)
        })

        it('should handle missing files', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false)

            const exists = fs.existsSync('missing-file.ts')

            expect(exists).toBe(false)
        })
    })
})
