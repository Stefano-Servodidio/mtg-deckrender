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

// Google Analytics 4 Testing Commands

// Spy on GA4 events by stubbing the gtag function
Cypress.Commands.add('spyOnGA', () => {
    cy.window().then((win) => {
        // Initialize gtag as a stub if it doesn't exist
        if (!win.gtag) {
            win.gtag = cy.stub().as('gtag')
        } else {
            cy.stub(win, 'gtag').as('gtag')
        }
        // Initialize dataLayer if it doesn't exist
        if (!win.dataLayer) {
            win.dataLayer = []
        }
    })
})

// Assert that a GA event was called with specific parameters
Cypress.Commands.add(
    'assertGAEvent',
    (eventName: string, params?: Record<string, unknown>) => {
        cy.get('@gtag').should('have.been.called')

        if (params) {
            // Check if gtag was called with the event and matching parameters
            cy.get('@gtag').should((stub) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const calls = (stub as any).getCalls()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const eventCall = calls.find(
                    (call: any) =>
                        call.args[0] === 'event' && call.args[1] === eventName
                )

                expect(
                    eventCall,
                    `Expected GA event "${eventName}" to be called`
                ).to.exist

                if (eventCall && params) {
                    const eventParams = eventCall.args[2] || {}
                    Object.keys(params).forEach((key) => {
                        expect(
                            eventParams[key],
                            `Expected ${key} to be ${params[key]}`
                        ).to.equal(params[key])
                    })
                }
            })
        } else {
            // Just check if the event was called
            cy.get('@gtag').should((stub) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const calls = (stub as any).getCalls()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const eventCall = calls.find(
                    (call: any) =>
                        call.args[0] === 'event' && call.args[1] === eventName
                )
                expect(
                    eventCall,
                    `Expected GA event "${eventName}" to be called`
                ).to.exist
            })
        }
    }
)

// Assert that GA page view was tracked
Cypress.Commands.add('assertGAPageView', (pagePath?: string) => {
    cy.get('@gtag').should((stub) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calls = (stub as any).getCalls()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageViewCall = calls.find(
            (call: any) =>
                call.args[0] === 'event' && call.args[1] === 'page_view'
        )

        expect(pageViewCall, 'Expected page_view event to be called').to.exist

        if (pageViewCall && pagePath) {
            const eventParams = pageViewCall.args[2] || {}
            expect(eventParams.page_path).to.include(pagePath)
        }
    })
})

// Override default commands if needed
declare global {
    namespace Cypress {
        interface Chainable {
            uploadDecklist(_decklistText: string): Chainable<Element>
            generateImage(_navigate?: boolean): Chainable<Element>
            downloadImage(_navigate?: boolean): Chainable<Element>
            waitForToast(_message?: string): Chainable<Element>
            spyOnGA(): Chainable<void>
            assertGAEvent(
                _eventName: string,
                _params?: Record<string, unknown>
            ): Chainable<void>
            assertGAPageView(_pagePath?: string): Chainable<void>
        }
    }
}
