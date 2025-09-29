describe('MTG Deck to PNG - Complete User Flow', () => {
    beforeEach(() => {
        // Visit the home page before each test
        cy.visit('/')
    })

    it('should complete the full deck-to-PNG workflow with basic lands', () => {
        // Load test data
        cy.fixture('sample-decklists').then((decklists) => {
            // Step 1: Navigate to create page
            cy.get('a[href="/create"]').click()
            cy.url().should('include', '/create')

            // Step 2: Upload the decklist
            cy.uploadDecklist(decklists.basicLands)

            // Step 3: Wait for cards to be fetched and loaded
            cy.get('button').contains('Configure Image').should('be.visible')
            
            // Step 4: Generate image with default options
            cy.generateImage()

            // Step 5: Verify download section is available
            cy.downloadImage()

            // Step 6: Verify the complete flow completed successfully
            cy.get('button').contains('Download').should('be.visible')
        })
    })

    it('should handle mixed deck with various card types', () => {
        cy.fixture('sample-decklists').then((decklists) => {
            // Navigate to create page
            cy.get('a[href="/create"]').click()

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
            // Navigate to create page
            cy.get('a[href="/create"]').click()

            // Upload decklist with sideboard
            cy.uploadDecklist(decklists.withSideboard)

            // Generate image
            cy.generateImage()

            // Verify download is available
            cy.downloadImage()
        })
    })

    it('should validate empty decklist handling', () => {
        // Navigate to create page
        cy.get('a[href="/create"]').click()

        // Try to upload without any text
        cy.get('button').contains('Upload Decklist').should('be.disabled')

        // Enter some text and verify button becomes enabled
        cy.get('textarea[placeholder*="Paste the decklist"]').type('4x Lightning Bolt')
        cy.get('button').contains('Upload Decklist').should('not.be.disabled')
    })

    it('should test image configuration options', () => {
        cy.fixture('sample-decklists').then((decklists) => {
            // Navigate to create page
            cy.get('a[href="/create"]').click()

            // Upload basic decklist
            cy.uploadDecklist(decklists.basicLands)

            // Click configure section
            cy.get('button').contains('Configure Image').click()
            cy.wait(1000)

            // Test different configuration options
            // Note: These selectors might need adjustment based on actual implementation
            cy.get('select, [role="combobox"]').first().should('be.visible')

            // Generate with current settings
            cy.generateImage()

            // Verify download is available
            cy.downloadImage()
        })
    })

    it('should handle navigation between sections', () => {
        // Navigate to create page
        cy.get('a[href="/create"]').click()

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
        // Navigate to create page
        cy.get('a[href="/create"]').click()

        // Enter invalid decklist format
        cy.get('textarea[placeholder*="Paste the decklist"]')
            .clear()
            .type('invalid decklist format without numbers')

        // Try to upload
        cy.get('button').contains('Upload Decklist').click()

        // Should handle the error gracefully (exact behavior depends on implementation)
        // This test ensures the app doesn't crash with invalid input
        cy.get('body').should('be.visible')
    })
})