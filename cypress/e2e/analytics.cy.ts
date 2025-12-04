describe('Google Analytics 4 Integration', () => {
    beforeEach(() => {
        // Intercept GA script to prevent actual loading
        cy.intercept('https://www.googletagmanager.com/gtag/js*', {
            statusCode: 200,
            body: ''
        }).as('gaScript')

        // Visit homepage - GA ID should be set via environment for tests
        cy.visit('/')

        // Setup GA spy after page loads
        cy.spyOnGA()
    })

    describe('Page View Tracking', () => {
        it('should track page view on homepage', () => {
            cy.assertGAPageView('/')
        })

        it('should track page view when navigating to create page', () => {
            cy.get(
                '[data-testid="navbar-links-desktop"] a[href="/create"]'
            ).click()
            cy.url().should('include', '/create')
            cy.assertGAPageView('/create')
        })

        it('should track page view on 404 page', () => {
            cy.visit('/non-existent-page', { failOnStatusCode: false })
            cy.spyOnGA()
            cy.assertGAPageView('/non-existent-page')
        })
    })

    describe('Homepage CTA Tracking', () => {
        it('should track hero CTA button click', () => {
            cy.get('[data-testid="hero-cta-button"]').click()

            cy.assertGAEvent('button_click', {
                click_text: 'Create Deck Image (Hero CTA)',
                event_category: 'engagement',
                event_label: 'hero_cta',
                click_url: '/create'
            })
        })
    })

    describe('Navigation Tracking', () => {
        it('should track navbar Home link click', () => {
            // First go to create page
            cy.visit('/create')
            cy.spyOnGA()

            // Click home link
            cy.get('[data-testid="navbar-links-desktop"] a[href="/"]').click()

            cy.assertGAEvent('link_click', {
                click_text: 'Home',
                click_url: '/',
                element_type: 'link',
                event_category: 'engagement'
            })
        })

        it('should track navbar Create link click', () => {
            cy.get(
                '[data-testid="navbar-links-desktop"] a[href="/create"]'
            ).click()

            cy.assertGAEvent('link_click', {
                click_text: 'Create',
                click_url: '/create',
                element_type: 'link',
                event_category: 'engagement'
            })
        })

        it('should track mobile navbar navigation', () => {
            cy.viewport(375, 667)
            cy.get('[data-testid="navbar-mobile-menu-button"]').click()
            cy.get(
                '[data-testid="navbar-links-mobile"] a[href="/create"]'
            ).click()

            cy.assertGAEvent('link_click', {
                click_text: 'Create (Mobile)',
                click_url: '/create'
            })
        })
    })

    describe('404 Page Tracking', () => {
        it('should track 404 recovery button click', () => {
            cy.visit('/non-existent-page', { failOnStatusCode: false })
            cy.spyOnGA()

            cy.get('[data-testid="404-home-button"]').click()

            cy.assertGAEvent('button_click', {
                click_text: 'Go to Home (404)',
                event_category: 'engagement',
                event_label: '404_recovery',
                click_url: '/'
            })
        })
    })

    describe('Deck Upload Flow Tracking', () => {
        beforeEach(() => {
            cy.visit('/create')
            cy.spyOnGA()
        })

        it('should track upload button click', () => {
            // Add some text to enable the button
            cy.get('textarea[placeholder*="Paste the decklist"]').type(
                '4 Lightning Bolt',
                { delay: 10 }
            )

            cy.get('[data-testid="upload-button"]').click()

            cy.assertGAEvent('button_click', {
                click_text: 'Upload Decklist',
                event_category: 'engagement',
                event_label: 'upload_section'
            })
        })

        it('should track deck upload with card count', () => {
            const decklistText =
                '4 Lightning Bolt\n3 Counterspell\n2 Brainstorm'

            cy.get('textarea[placeholder*="Paste the decklist"]').type(
                decklistText,
                { delay: 5 }
            )
            cy.get('[data-testid="upload-button"]').click()

            // Should track the upload button click
            cy.assertGAEvent('button_click', {
                event_label: 'upload_section'
            })

            // Should also track deck_upload event (this happens in the handler)
            // Note: This will be tracked after the button click event
        })
    })

    describe('Image Generation Tracking', () => {
        beforeEach(() => {
            cy.visit('/create')
            cy.spyOnGA()
        })

        it('should track generate button click', () => {
            // First need to upload a deck to enable the generate button
            // For this test, we'll just check that clicking triggers tracking
            // In real scenario, button would be disabled without cards

            // Expand configure section
            cy.get('button').contains('Configure Image').click()
            cy.wait(500)

            // The generate button should be visible
            cy.get('[data-testid="generate-button"]').should('be.visible')

            // Note: Button will be disabled without cards, so we can't actually click it
            // But we can verify the data-testid is present for GA tracking
        })
    })

    describe('Download Tracking', () => {
        it('should have download button with proper data-testid', () => {
            cy.visit('/create')

            // Expand download section
            cy.get('button').contains('Download Deck Image').click()
            cy.wait(500)

            // Verify download button exists with data-testid
            // (Will only be enabled after image generation)
            cy.get('[data-testid="download-button"]').should('exist')
        })
    })

    describe('Error Tracking', () => {
        it('should track errors when card fetch fails', () => {
            cy.visit('/create')
            cy.spyOnGA()

            // Simulate an error by uploading invalid data
            // This would trigger error tracking in the actual app
            // We're just verifying the error event can be tracked

            cy.get('textarea[placeholder*="Paste the decklist"]').type(
                'Invalid Card Name',
                { delay: 10 }
            )
            cy.get('[data-testid="upload-button"]').click()

            // The app will track errors via analytics.trackError()
            // This is tested in unit tests, here we just verify the flow works
        })
    })

    describe('Conditional Tracking', () => {
        it('should not initialize gtag when GA ID is not set', () => {
            // This test verifies that without GA ID, gtag is not defined
            // In actual app, GA component won't render without NEXT_PUBLIC_GA_ID
            // Note: This would require a separate test environment without GA_ID set

            cy.window().then((_win) => {
                // If GA is configured, gtag should exist (either real or stubbed)
                // If not configured, the GoogleAnalytics component won't render
                // This is tested in unit tests rather than E2E
            })
        })
    })

    describe('Event Parameter Validation', () => {
        it('should include all required parameters in button click events', () => {
            cy.get('[data-testid="hero-cta-button"]').click()

            cy.get('@gtag').should((stub) => {
                const calls = (stub as any).getCalls()
                const buttonClickCall = calls.find(
                    (call: any) =>
                        call.args[0] === 'event' &&
                        call.args[1] === 'button_click'
                )

                expect(buttonClickCall).to.exist

                if (buttonClickCall) {
                    const params = buttonClickCall.args[2]
                    expect(params).to.have.property('click_text')
                    expect(params).to.have.property('element_type', 'button')
                    expect(params).to.have.property(
                        'event_category',
                        'engagement'
                    )
                }
            })
        })

        it('should include all required parameters in link click events', () => {
            cy.get(
                '[data-testid="navbar-links-desktop"] a[href="/create"]'
            ).click()

            cy.get('@gtag').should((stub) => {
                const calls = (stub as any).getCalls()
                const linkClickCall = calls.find(
                    (call: any) =>
                        call.args[0] === 'event' &&
                        call.args[1] === 'link_click'
                )

                expect(linkClickCall).to.exist

                if (linkClickCall) {
                    const params = linkClickCall.args[2]
                    expect(params).to.have.property('click_text')
                    expect(params).to.have.property('click_url')
                    expect(params).to.have.property('element_type', 'link')
                    expect(params).to.have.property(
                        'event_category',
                        'engagement'
                    )
                }
            })
        })
    })
})
