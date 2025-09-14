'use client'
import { DropZone } from '@/components/DropZone'
import {
    Box,
    Button,
    Divider,
    HStack,
    Text,
    Textarea,
    useColorModeValue,
    VStack,
    Progress
} from '@chakra-ui/react'
import { FaUpload } from 'react-icons/fa'

interface ProgressInfo {
    current: number
    total: number
    message: string
    percentage: number
}

export interface UploadSectionProps {
    decklistText: string
    setDecklistText: (text: string) => void
    handleUpload: () => void
    isLoadingCards: boolean
    handleFileUpload: (files: File[]) => void
    progress?: ProgressInfo | null
}

const UploadSection: React.FC<UploadSectionProps> = ({
    decklistText,
    setDecklistText,
    handleUpload,
    isLoadingCards,
    handleFileUpload,
    progress
}) => {
    return (
        <VStack spacing={6}>
            <Box w="full">
                <Text fontWeight="semibold" mb={3} color="gray.700">
                    Paste Decklist Text
                </Text>
                <Text fontSize="sm" color="gray.500" mb={2}>
                    Paste the decklist list one card per line, with the quantity
                    and cardname (e.g. &quot;2x Llanowar Elves&quot;, &quot;1
                    Black Lotus&quot;).
                    <br /> You can add a sideboard by including an empty line.
                    Works with or without the keyword &quot;SIDEBOARD&quot;.
                </Text>
                <Textarea
                    value={decklistText}
                    onChange={(e) => setDecklistText(e.target.value)}
                    placeholder="Paste your decklist here..."
                    size="lg"
                    minH="200px"
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    border="2px dashed"
                    borderColor="gray.300"
                    _hover={{
                        borderColor: 'purple.300'
                    }}
                    _focus={{
                        borderColor: 'purple.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)'
                    }}
                />
            </Box>

            <HStack w="full" align="center">
                <Divider />
                <Text color="gray.500" fontWeight="medium" px={4}>
                    OR
                </Text>
                <Divider />
            </HStack>

            {/* File Upload Section */}
            <Box w="full">
                <Text fontWeight="semibold" mb={3} color="gray.700">
                    Upload Text File
                </Text>
                <DropZone onFileUpload={handleFileUpload} />
            </Box>

            {/* Progress Section */}
            {isLoadingCards && progress && (
                <Box w="full">
                    <VStack spacing={3}>
                        <Box w="full">
                            <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                                    {progress.message}
                                </Text>
                                <Text fontSize="sm" fontWeight="medium" color="purple.600">
                                    {progress.current}/{progress.total} ({progress.percentage}%)
                                </Text>
                            </HStack>
                            <Progress
                                value={progress.percentage}
                                colorScheme="purple"
                                size="md"
                                borderRadius="md"
                                bg="gray.100"
                            />
                        </Box>
                    </VStack>
                </Box>
            )}

            {/* Upload Button */}
            <Button
                size="lg"
                colorScheme="purple"
                leftIcon={<FaUpload />}
                onClick={handleUpload}
                isLoading={isLoadingCards}
                loadingText="Uploading..."
                w={{ base: 'full', md: 'auto' }}
                px={8}
                _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg'
                }}
                transition="all 0.2s"
                disabled={!decklistText.trim() || isLoadingCards}
            >
                Upload Decklist
            </Button>

            {/* Loading indicator */}
            {/* {isLoadingCards && (
                                                <Text
                                                    color="blue.500"
                                                    textAlign="center"
                                                >
                                                    Fetching card data...
                                                </Text>
                                            )} */}

            {/* Success indicator */}
            {/* {cardsData?.cards && (
                                                <Text
                                                    color="green.500"
                                                    textAlign="center"
                                                >
                                                    Successfully loaded{' '}
                                                    {cardsData.cards.length}{' '}
                                                    unique cards!
                                                </Text>
                                            )} */}
        </VStack>
    )
}

export default UploadSection
