export {} // Make this file an external module

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

export {}

// Custom command to upload a decklist
Cypress.Commands.add('uploadDecklist', (decklistText: string) => {
    // Find the textarea and enter the decklist
    cy.get('textarea[placeholder*="Paste the decklist"]')
        .clear()
        .type(decklistText, { delay: 10 })

    // Click the upload button
    cy.get('button[data-testid="upload-button"]').click()

    // Wait for the upload to complete - look for success indicators
    // cy.get('[data-testid="upload-progress"], .chakra-progress', {
    //     timeout: 30000
    // }).should('be.visible')

    // Wait for the upload to finish (progress disappears or shows completion)
    cy.get('button[data-testid="upload-button"]').should('not.be.disabled', {
        timeout: 60000
    })
})

// Custom command to generate the deck image
Cypress.Commands.add('generateImage', (navigate = false) => {
    // Click the configure section to expand it if needed
    if (navigate) {
        cy.get('button').contains('Configure Image').click()
    }

    // Wait a moment for the section to expand
    cy.wait(1000)

    // Click the generate button
    cy.get('button[data-testid="generate-button"]').click()

    // Wait for generation to complete
    cy.get('button[data-testid="generate-button"]').contains(
        'Generate Deck Image',
        {
            timeout: 60000
        }
    )
})

// Custom command to download the generated image
Cypress.Commands.add('downloadImage', (navigate = false) => {
    // Click the download section to expand it if needed
    if (navigate) {
        cy.get('button').contains('Download Deck Image').click()
    }

    // Wait for the section to expand
    cy.wait(1000)

    // Verify download button is available
    cy.get('a[data-testid="download-button"]')
        .should('be.visible')
        .and('not.be.disabled')
})

// Custom command to wait for toast messages
Cypress.Commands.add('waitForToast', (message?: string) => {
    if (message) {
        cy.get('.chakra-alert, [role="alert"]')
            .contains(message)
            .should('be.visible')
    } else {
        cy.get('.chakra-alert, [role="alert"]').should('be.visible')
    }
})

// Override default commands if needed
declare global {
    namespace Cypress {
        interface Chainable {
            uploadDecklist(_decklistText: string): Chainable<Element>
            generateImage(): Chainable<Element>
            downloadImage(): Chainable<Element>
            waitForToast(_message?: string): Chainable<Element>
        }
    }
}
