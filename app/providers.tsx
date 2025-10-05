'use client'

import theme from '@/theme'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { useThemeMode } from '@/hooks/useThemeMode'
import { useEffect } from 'react'

function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { themeMode, isLoaded } = useThemeMode()

    useEffect(() => {
        if (isLoaded && typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', themeMode)
            // Set Chakra UI color mode class
            if (themeMode === 'dark') {
                document.documentElement.classList.add('chakra-ui-dark')
                document.documentElement.classList.remove('chakra-ui-light')
            } else {
                document.documentElement.classList.add('chakra-ui-light')
                document.documentElement.classList.remove('chakra-ui-dark')
            }
        }
    }, [themeMode, isLoaded])

    return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <ThemeProvider>{children}</ThemeProvider>
        </ChakraProvider>
    )
}
