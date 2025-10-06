'use client'

import { IconButton, useColorMode } from '@chakra-ui/react'
import { FaMoon, FaSun } from 'react-icons/fa'

interface ThemeToggleButtonProps {
    isMobile?: boolean
}

export function ThemeToggleButton({ isMobile = false }: ThemeToggleButtonProps) {
    const { colorMode, toggleColorMode } = useColorMode()

    return (
        <IconButton
            data-testid={isMobile ? "theme-toggle-button-mobile" : "theme-toggle-button"}
            aria-label="Toggle theme"
            icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
            onClick={toggleColorMode}
            variant="ghost"
            size="md"
        />
    )
}
