describe('Navigation and UI Elements', () => {
    it('should navigate through the main pages', () => {
        // Visit home page
        cy.visit('/')

        // Check that main elements are present
        cy.get('body').should('contain.text', 'MTG DeckRender')

        // Navigate to create page from navbar
        cy.get(
            '[data-testid="navbar-container"] [data-testid="navbar-links-desktop"] a[href="/create"]'
        ).click()
        cy.url().should('include', '/create')

        // Check that create page elements are present
        cy.get('button').contains('Upload Decklist').should('be.visible')
        cy.get('[data-testid="create-page"]').should('be.visible')

        // Navigate back to home from navbar
        cy.get(
            '[data-testid="navbar-container"] [data-testid="navbar-links-desktop"] a[href="/"]'
        ).click()
        cy.url().should('not.include', '/create')

        // navigate to create page using hero section link
        cy.get('[data-testid="home-page-content"] a[href="/create"]').click()
        cy.url().should('include', '/create')

        // Test mobile navigation
        cy.viewport(375, 667)

        cy.get('[data-testid="navbar-mobile-menu-button"]').click()
        cy.get(
            '[data-testid="navbar-container"] [data-testid="navbar-links-mobile"] a[href="/"]'
        )
            .should('be.visible')
            .click()
        cy.url().should('not.include', '/create')

        cy.get('[data-testid="navbar-mobile-menu-button"]').click()
        cy.get(
            '[data-testid="navbar-container"] [data-testid="navbar-links-mobile"] a[href="/create"]'
        )
            .should('be.visible')
            .click()
        cy.url().should('include', '/create')
    })

    it('should have responsive design elements', () => {
        cy.visit('/create')

        // Test desktop view
        cy.viewport(1280, 720)
        cy.get('textarea[data-testid="upload-decklist-textarea"]').should(
            'be.visible'
        )

        // Test tablet view
        cy.viewport(768, 1024)
        cy.get('textarea[data-testid="upload-decklist-textarea"]').should(
            'be.visible'
        )

        // Test mobile view
        cy.viewport(375, 667)
        cy.get('textarea[data-testid="upload-decklist-textarea"]').should(
            'be.visible'
        )
    })
})
