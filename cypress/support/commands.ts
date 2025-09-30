// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to upload a decklist
Cypress.Commands.add('uploadDecklist', (decklistText: string) => {
    // Navigate to the create page
    cy.visit('/create')
    
    // Find the textarea and enter the decklist
    cy.get('textarea[placeholder*="Paste the decklist"]')
        .clear()
        .type(decklistText, { delay: 10 })
    
    // Click the upload button
    cy.get('button').contains('Upload Decklist').click()
    
    // Wait for the upload to complete - look for success indicators
    cy.get('[data-testid="upload-progress"], .chakra-progress', { timeout: 30000 })
        .should('be.visible')
    
    // Wait for the upload to finish (progress disappears or shows completion)
    cy.get('button').contains('Upload Decklist').should('not.be.disabled', { timeout: 60000 })
})

// Custom command to generate the deck image
Cypress.Commands.add('generateImage', () => {
    // Click the configure section to expand it if needed
    cy.get('button').contains('Configure Image').click()
    
    // Wait a moment for the section to expand
    cy.wait(1000)
    
    // Click the generate button
    cy.get('button').contains('Generate Deck Image').click()
    
    // Wait for generation to complete
    cy.get('button').contains('Generate Deck Image').should('not.have.attr', 'data-loading', 'true', { timeout: 60000 })
})

// Custom command to download the generated image
Cypress.Commands.add('downloadImage', () => {
    // Click the download section to expand it if needed
    cy.get('button').contains('Download Deck Image').click()
    
    // Wait for the section to expand
    cy.wait(1000)
    
    // Verify download button is available
    cy.get('button').contains('Download').should('be.visible').and('not.be.disabled')
})

// Custom command to wait for toast messages
Cypress.Commands.add('waitForToast', (message?: string) => {
    if (message) {
        cy.get('.chakra-alert, [role="alert"]').contains(message).should('be.visible')
    } else {
        cy.get('.chakra-alert, [role="alert"]').should('be.visible')
    }
})

// Override default commands if needed
declare global {
    namespace Cypress {
        interface Chainable {
            uploadDecklist(decklistText: string): Chainable<Element>
            generateImage(): Chainable<Element>
            downloadImage(): Chainable<Element>
            waitForToast(message?: string): Chainable<Element>
        }
    }
}