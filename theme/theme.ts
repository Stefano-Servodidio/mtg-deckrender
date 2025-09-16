import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react'

export const theme = extendTheme(
    withDefaultColorScheme({ colorScheme: 'purple' }),
    {
        colors: {
            brand: {
                50: '#f7fafc',
                100: '#edf2f7',
                200: '#e2e8f0',
                300: '#cbd5e0',
                400: '#a0aec0',
                500: '#718096',
                600: '#4a5568',
                700: '#2d3748',
                800: '#1a202c',
                900: '#171923'
            },
            purple: {
                50: '#faf5ff',
                100: '#e9d8fd',
                200: '#d6bcfa',
                300: '#b794f6',
                400: '#9f7aea',
                500: '#805ad5',
                600: '#6b46c1',
                700: '#553c9a',
                800: '#44337a',
                900: '#322659'
            },
            orange: {
                50: '#fffaf0',
                100: '#feebc8',
                200: '#fbd38d',
                300: '#f6ad55',
                400: '#ed8936',
                500: '#dd6b20',
                600: '#c05621',
                700: '#9c4221',
                800: '#7b341e',
                900: '#652b19'
            }
        },
        components: {
            Button: {
                defaultProps: {
                    colorScheme: 'purple'
                }
            },
            Icon: {
                baseStyle: {
                    width: 8,
                    height: 8
                }
            },
            AccordionButton: {
                baseStyle: {
                    p: { base: 4, md: 6 }
                }
            },
            AccordionBody: {
                baseStyle: {
                    p: { base: 4, md: 6 }
                }
            }
        }
    }
)
