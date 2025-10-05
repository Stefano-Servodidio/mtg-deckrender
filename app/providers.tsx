'use client'

import theme from '@/theme'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { useEffect } from 'react'

function ColorModeManager({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Load theme from localStorage and sync with Chakra UI
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('mtg-deck-theme-mode')
            if (savedTheme === 'dark' || savedTheme === 'light') {
                // Set Chakra's localStorage
                localStorage.setItem('chakra-ui-color-mode', savedTheme)
            }
        }
    }, [])

    return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <ChakraProvider theme={theme}>
                <ColorModeManager>{children}</ColorModeManager>
            </ChakraProvider>
        </>
    )
}
