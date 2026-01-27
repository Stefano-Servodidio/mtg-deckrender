// filepath: cypress/e2e/cookie-consent-flow.cy.ts
describe('Cookie consent flow', () => {
    const consentCookieName = 'mtg_deckrender_cookie_consent'

    const clearConsentCookie = () => {
        cy.clearCookie(consentCookieName)
    }

    const visitHome = () => {
        cy.visit('/')
    }

    const getBanner = () => cy.get('[data-testid="cookie-banner"]')

    beforeEach(() => {
        clearConsentCookie()
    })

    it('shows the banner on first visit', () => {
        visitHome()
        getBanner().should('be.visible')
        cy.get('[data-testid="accept-all-button"]').should('be.visible')
        cy.get('[data-testid="reject-all-button"]').should('be.visible')
        cy.get('[data-testid="settings-button"]').should('be.visible')
    })

    it('accepts all cookies and hides the banner', () => {
        visitHome()
        cy.get('[data-testid="accept-all-button"]').click()
        getBanner().should('not.exist')

        cy.getCookie(consentCookieName).should('exist')
        cy.getCookie(consentCookieName).then((cookie) => {
            const value = decodeURIComponent(cookie?.value ?? '')
            const preferences = JSON.parse(value)
            expect(preferences.necessary).to.eq(true)
            expect(preferences.analytics).to.eq(true)
            expect(preferences.marketing).to.eq(true)
        })
    })

    it('rejects all non-necessary cookies and hides the banner', () => {
        visitHome()
        cy.get('[data-testid="reject-all-button"]').click()
        getBanner().should('not.exist')

        cy.getCookie(consentCookieName).should('exist')
        cy.getCookie(consentCookieName).then((cookie) => {
            const value = decodeURIComponent(cookie?.value ?? '')
            const preferences = JSON.parse(value)
            expect(preferences.necessary).to.eq(true)
            expect(preferences.analytics).to.eq(false)
            expect(preferences.marketing).to.eq(false)
        })
    })

    it('saves custom preferences from settings', () => {
        visitHome()
        cy.get('[data-testid="settings-button"]').click()

        cy.get('[data-testid="analytics-cookies-switch"]').click()
        cy.get('[data-testid="marketing-cookies-switch"]').click()

        cy.get('[data-testid="save-preferences-button"]').click()
        getBanner().should('not.exist')

        cy.getCookie(consentCookieName).should('exist')
        cy.getCookie(consentCookieName).then((cookie) => {
            const value = decodeURIComponent(cookie?.value ?? '')
            const preferences = JSON.parse(value)
            expect(preferences.necessary).to.eq(true)
            expect(preferences.analytics).to.eq(true)
            expect(preferences.marketing).to.eq(true)
        })
    })

    it('does not show banner when consent cookie exists', () => {
        visitHome()
        cy.get('[data-testid="accept-all-button"]').click()
        getBanner().should('not.exist')

        cy.reload()
        getBanner().should('not.exist')
    })
})
