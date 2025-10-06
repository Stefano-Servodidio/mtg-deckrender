'use client'

import theme from '@/theme'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ColorModeScript 
                initialColorMode={theme.config.initialColorMode}
                storageKey="chakra-ui-color-mode"
            />
            <ChakraProvider theme={theme}>
                {children}
            </ChakraProvider>
        </>
    )
}
