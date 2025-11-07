// Scroll to accordion button with proper offset for navbar
export const scrollToAccordionButton = (element: HTMLButtonElement | null) => {
    // Delay to allow accordion animation to complete
    setTimeout(() => {
        if (element) {
            // Get navbar height dynamically
            const navbar = document.querySelector(
                '[data-testid="navbar-container"]'
            )
            const navbarHeight = navbar?.clientHeight || 80
            const additionalPadding = 20 // Extra space for visual comfort

            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition =
                elementPosition +
                window.scrollY -
                navbarHeight -
                additionalPadding

            window.scrollTo({
                top: Math.max(0, offsetPosition), // Prevent negative scroll
                behavior: 'smooth'
            })
        }
    }, 150) // 150ms works well with Chakra UI accordion animations
}
