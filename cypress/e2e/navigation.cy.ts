describe('Navigation and UI Elements', () => {
    it('should navigate through the main pages', () => {
        // Visit home page
        cy.visit('/')
        
        // Check that main elements are present
        cy.get('body').should('contain.text', 'MTG Deck to PNG')
        
        // Navigate to create page
        cy.get('a[href="/create"]').click()
        cy.url().should('include', '/create')
        
        // Check that create page elements are present
        cy.get('button').contains('Upload Decklist').should('be.visible')
        cy.get('textarea[placeholder*="Paste the decklist"]').should('be.visible')
        
        // Navigate back to home
        cy.get('nav a[href="/"]').click()
        cy.url().should('not.include', '/create')
    })

    it('should have responsive design elements', () => {
        cy.visit('/create')
        
        // Test desktop view
        cy.viewport(1280, 720)
        cy.get('textarea[placeholder*="Paste the decklist"]').should('be.visible')
        
        // Test tablet view
        cy.viewport(768, 1024)
        cy.get('textarea[placeholder*="Paste the decklist"]').should('be.visible')
        
        // Test mobile view
        cy.viewport(375, 667)
        cy.get('textarea[placeholder*="Paste the decklist"]').should('be.visible')
    })

    it('should display footer information', () => {
        cy.visit('/')
        
        // Check footer elements
        cy.get('footer').within(() => {
            cy.should('contain.text', 'Legal Disclaimer')
            cy.should('contain.text', 'Wizards of the Coast')
            cy.should('contain.text', 'Scryfall API')
        })
    })

    it('should handle keyboard navigation', () => {
        cy.visit('/create')
        
        // Test tab navigation
        cy.get('body').tab()
        cy.focused().should('be.visible')
        
        // Test textarea focus
        cy.get('textarea[placeholder*="Paste the decklist"]').focus()
        cy.focused().should('have.attr', 'placeholder')
    })
})