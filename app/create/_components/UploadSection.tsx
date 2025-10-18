'use client'
import { DropZone } from '@/components/DropZone'
import {
    Box,
    Button,
    HStack,
    Text,
    Textarea,
    useColorModeValue,
    VStack,
    Progress,
    useToast
} from '@chakra-ui/react'
import { useCallback, useState } from 'react'
import { FaUpload } from 'react-icons/fa'

interface ProgressInfo {
    current: number
    total: number
    message: string
    percentage: number
}

export interface UploadSectionProps {
    fetchCards: (_decklistText: string) => Promise<void>
    isLoadingCards: boolean
    progress?: ProgressInfo | null
}

const UploadSection: React.FC<UploadSectionProps> = ({
    fetchCards,
    isLoadingCards,
    progress
}) => {
    const [decklistText, setDecklistText] = useState('')
    const toast = useToast()

    /* Handlers */
    const handleUpload = async () => {
        if (!decklistText.trim()) {
            toast({
                title: 'No decklist provided',
                description: 'Please paste or upload a decklist first.',
                status: 'warning',
                duration: 3000,
                isClosable: true
            })
            return
        }

        await fetchCards(decklistText.trim())
    }

    const handleFileUpload = useCallback(
        (files: File[]) => {
            const file = files[0]
            if (file && file.type === 'text/plain') {
                const reader = new FileReader()
                reader.onload = (e) => {
                    const content = e.target?.result as string
                    setDecklistText(content)
                    toast({
                        title: 'File uploaded successfully',
                        description: 'Your decklist has been loaded.',
                        status: 'success',
                        duration: 3000,
                        isClosable: true
                    })
                }
                reader.readAsText(file)
            } else {
                toast({
                    title: 'Invalid file type',
                    description: 'Please upload a text file (.txt).',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                })
            }
        },
        [toast]
    )

    return (
        <VStack spacing={6} w="full">
            <HStack
                spacing={4}
                w="full"
                h="200px"
                flex={1}
                align="start"
                flexWrap="wrap"
            >
                <Box w={{ base: 'full', md: 'auto' }} h="full" flex={1}>
                    <Text
                        fontWeight="semibold"
                        color="gray.700"
                        w="fit-content"
                        mb={3}
                    >
                        Paste Decklist Text
                    </Text>
                    <Textarea
                        value={decklistText}
                        onChange={(e) => setDecklistText(e.target.value)}
                        placeholder={
                            'Paste the decklist list one card per line, with the quantity and cardname (e.g. "2x Llanowar Elves", "1 Black Lotus").\nYou can add a sideboard by including an empty line. Works with or without the keyword "SIDEBOARD".'
                        }
                        size="lg"
                        minH="300px"
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        border="2px dashed"
                        borderColor="gray.300"
                        _hover={{
                            borderColor: 'orange.300'
                        }}
                        _focus={{
                            borderColor: 'orange.400',
                            boxShadow:
                                '0 0 0 1px var(--chakra-colors-orange-400)'
                        }}
                    />
                </Box>
                {/* File Upload Section */}
                <VStack
                    w={{ base: 'full', md: '40%', lg: '30%' }}
                    h="full"
                    align={'flex-start'}
                    gap={0}
                >
                    <Text fontWeight="semibold" mb={3} color="gray.700">
                        Or upload Text File
                    </Text>
                    <Box flex={1} w="full">
                        <DropZone
                            onFileUpload={handleFileUpload}
                            colorScheme="orange"
                            wrapperProps={{ h: '300px' }}
                        />
                    </Box>
                </VStack>
            </HStack>
            {/* Progress Section */}
            {isLoadingCards && progress && (
                <Box w="full">
                    <VStack spacing={3}>
                        <Box w="full">
                            <HStack justify="space-between" mb={2}>
                                <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color="gray.700"
                                >
                                    {progress.message}
                                </Text>
                                <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color="orange.600"
                                >
                                    {progress.current}/{progress.total} (
                                    {progress.percentage}%)
                                </Text>
                            </HStack>
                            <Progress
                                data-testid="upload-progress"
                                value={progress.percentage}
                                colorScheme="orange"
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
                data-testid="upload-button"
                size="lg"
                leftIcon={<FaUpload />}
                onClick={handleUpload}
                isLoading={isLoadingCards}
                colorScheme="orange"
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
        </VStack>
    )
}

export default UploadSection
