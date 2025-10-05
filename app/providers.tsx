'use client'

import theme from '@/theme'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { useEffect } from 'react'

function ColorModeManager({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Sync our custom localStorage key with Chakra UI's key
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('mtg-deck-theme-mode')
            const chakraTheme = localStorage.getItem('chakra-ui-color-mode')
            
            // If we have a saved theme but Chakra doesn't, sync it
            if (savedTheme && !chakraTheme) {
                localStorage.setItem('chakra-ui-color-mode', savedTheme)
                // Force a re-render by dispatching a storage event
                window.dispatchEvent(new Event('storage'))
            }
        }
    }, [])

    return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ColorModeScript 
                initialColorMode={theme.config.initialColorMode}
                storageKey="chakra-ui-color-mode"
            />
            <ChakraProvider theme={theme}>
                <ColorModeManager>{children}</ColorModeManager>
            </ChakraProvider>
        </>
    )
}
