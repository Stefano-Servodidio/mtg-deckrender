describe('MTG Deck to PNG - Complete User Flow', () => {
    beforeEach(() => {
        // Visit the create page before each test
        cy.visit('/create')
    })

    it('should complete the full deck-to-PNG workflow with basic lands', () => {
        // Load test data
        cy.fixture('sample-decklists').then((decklists) => {
            // Step 1: Upload the decklist
            cy.uploadDecklist(decklists.basicLands)

            // Step 2: Wait for cards to be fetched and loaded
            cy.get('button').contains('Configure Image').should('be.visible')

            // Step 3: Generate image with default options
            cy.generateImage()

            // Step 4: Verify download section is available
            cy.downloadImage()
        })
    })

    it('should handle mixed deck with various card types', () => {
        cy.fixture('sample-decklists').then((decklists) => {
            // Upload a more complex decklist
            cy.uploadDecklist(decklists.mixedDeck)

            // Generate image
            cy.generateImage()

            // Verify download is available
            cy.downloadImage()
        })
    })

    it('should handle deck with sideboard', () => {
        cy.fixture('sample-decklists').then((decklists) => {
            // Upload decklist with sideboard
            cy.uploadDecklist(decklists.withSideboard)

            // Generate image
            cy.generateImage()

            // Verify download is available
            cy.downloadImage()
        })
    })

    it('should validate empty decklist handling', () => {
        // Try to upload without any text
        cy.get('button[data-testid="upload-button"]').should('be.disabled')

        // Enter some text and verify button becomes enabled
        cy.get('textarea[placeholder*="Paste the decklist"]').type(
            '4x Lightning Bolt'
        )
        cy.get('button[data-testid="upload-button"]').should('not.be.disabled')
    })

    it('should test image configuration options', () => {
        cy.fixture('sample-decklists').then((decklists) => {
            // Upload basic decklist
            cy.uploadDecklist(decklists.basicLands)

            // Verify configure section is accessible
            cy.get('[data-testid="configuration-image-size"]')
                .should('be.visible')
                .and('contain', 'Instagram Square (1080x1080)')

            // Click configure section
            cy.get('button[data-testid="configure-options-button"]').click()
            cy.wait(500)

            // Test different configuration options
            // Note: These selectors might need adjustment based on actual implementation
            cy.get('select[data-testid^="filter-select-imageSize"]')
                .should('be.visible')
                .select('facebook_post')

            // Close configuration options
            cy.get('button[data-testid="configure-options-button"]').click()
            cy.wait(500)

            // Verify summary reflects changes
            cy.get('[data-testid="configuration-image-size"]')
                .should('be.visible')
                .and('contain', 'Facebook Post (1200x630)')

            // Generate with current settings
            cy.generateImage()

            // Verify download is available
            cy.downloadImage()
        })
    })

    it('should handle navigation between sections', () => {
        // Test accordion functionality
        cy.get('button').contains('Upload Decklist').should('be.visible')
        cy.get('button').contains('Configure Image').should('be.visible')
        cy.get('button').contains('Download Deck Image').should('be.visible')

        // Click each section to verify they expand/collapse
        cy.get('button').contains('Configure Image').click()
        cy.get('button').contains('Download Deck Image').click()
        cy.get('button').contains('Upload Decklist').click()
    })

    it('should display proper error handling for invalid decklist', () => {
        // Enter invalid decklist format
        cy.get('textarea[placeholder*="Paste the decklist"]')
            .clear()
            .type('invalid decklist format without numbers')

        // Try to upload
        cy.get('button[data-testid="upload-button"]').click()

        // Should handle the error gracefully (exact behavior depends on implementation)
        // This test ensures the app doesn't crash with invalid input
        cy.get('body').should('be.visible')

        // Optionally, check for an error message or toast notification
        cy.waitForToast('No valid cards found in the decklist')
    })
})
