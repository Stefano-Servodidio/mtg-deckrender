'use client'

import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Badge,
    Code,
    Divider,
    Alert,
    AlertIcon,
    AlertDescription,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer
} from '@chakra-ui/react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

/**
 * Decklist format guide — static informational page.
 * Covers all 7 supported formats with example snippets and key parsing signals.
 */
export default function GuidePage() {
    return (
        <Box minH="100vh" display="flex" flexDirection="column">
            <Navbar />
            <Box flex={1} py={12} bg="gray.50">
                <Container maxW="4xl">
                    <VStack spacing={10} align="stretch">
                        {/* Header */}
                        <VStack spacing={3} align="start">
                            <Heading
                                size="xl"
                                bgGradient="linear(to-r, purple.400, blue.400)"
                                bgClip="text"
                            >
                                Decklist Format Guide
                            </Heading>
                            <Text color="gray.600" fontSize="lg">
                                MTG DeckRender automatically detects the format
                                of your decklist. For best results, use one of
                                the formats below — each one tells us exactly
                                which printing to use.
                            </Text>
                        </VStack>

                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription fontSize="sm">
                                When an exact set code and collector number are
                                present, the image for that specific printing is
                                used. Name-only formats will use Scryfall's
                                default printing for the card.
                            </AlertDescription>
                        </Alert>

                        {/* Format priority table */}
                        <Section title="Supported Formats">
                            <Text color="gray.600" mb={4}>
                                Formats are detected in the following priority
                                order. Higher-priority formats use more precise
                                identifiers.
                            </Text>
                            <TableContainer>
                                <Table
                                    size="sm"
                                    variant="simple"
                                    bg="white"
                                    borderRadius="md"
                                    overflow="hidden"
                                >
                                    <Thead bg="purple.50">
                                        <Tr>
                                            <Th>Format</Th>
                                            <Th>Source</Th>
                                            <Th>Identifier</Th>
                                            <Th>Commander</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        <FormatRow
                                            format="MTGO .dek"
                                            source="Magic Online"
                                            identifier="MTGO ID → Name"
                                            commander="Annotation flag"
                                        />
                                        <FormatRow
                                            format="MTGO .csv"
                                            source="Magic Online"
                                            identifier="MTGO ID → Collector+Set → Name"
                                            commander="Annotation + Sideboarded"
                                        />
                                        <FormatRow
                                            format="Moxfield Exact"
                                            source="Moxfield"
                                            identifier="Collector+Set → Name+Set → Name"
                                            commander="Section header"
                                        />
                                        <FormatRow
                                            format="Arena Default"
                                            source="MTG Arena"
                                            identifier="Collector+Set → Name+Set → Name"
                                            commander="Section header"
                                        />
                                        <FormatRow
                                            format="MTGGoldfish Exact"
                                            source="MTGGoldfish"
                                            identifier="Name+Set → Name"
                                            commander="—"
                                        />
                                        <FormatRow
                                            format="Plain Text"
                                            source="Any"
                                            identifier="Name"
                                            commander="Single-card trailing section"
                                        />
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        </Section>

                        <Divider />

                        {/* Moxfield Exact */}
                        <Section
                            title="Moxfield — Copy for Moxfield"
                            badge="Recommended"
                            badgeColor="green"
                        >
                            <Text color="gray.600" mb={3}>
                                Use <strong>Copy → Copy for Moxfield</strong> on
                                any deck page. Each line includes the set code
                                and collector number in parentheses — the most
                                precise identifier available without an MTGO
                                export.
                            </Text>
                            <CodeBlock>{`4 Archon of Cruelty (MH2) 342
4 Bloodstained Mire (MH3) 216
1 Dauthi Voidwalker (TDC) 176

SIDEBOARD:
2 Nihil Spellbomb (PLST) SOM-187
1 Surgical Extraction (OTP) 19`}</CodeBlock>
                            <SignalBox
                                signals={[
                                    'Lines end with (SET) collector_number',
                                    'Optional SIDEBOARD: section separator',
                                    'Optional Commander section header'
                                ]}
                            />
                        </Section>

                        <Divider />

                        {/* Arena Default */}
                        <Section title="Magic Arena — Default Export">
                            <Text color="gray.600" mb={3}>
                                Export your deck from MTG Arena using the
                                default export option. Section headers (
                                <Code>Deck</Code>, <Code>Commander</Code>,{' '}
                                <Code>Sideboard</Code>) mark each group.
                            </Text>
                            <CodeBlock>{`Commander
1 Juri, Master of the Revue (MUL) 46

Deck
1 Academy Manufactor (MKC) 221
4 Blood Artist (JMP) 206
4 Bloodghast (PLST) ZEN-83

Sideboard
2 Nihil Spellbomb (SOM) 195`}</CodeBlock>
                            <SignalBox
                                signals={[
                                    'Commander / Deck / Sideboard section headers',
                                    'Lines end with (SET) collector_number',
                                    'Commander section assigns groupId 0'
                                ]}
                            />
                        </Section>

                        <Divider />

                        {/* MTGGoldfish Exact */}
                        <Section title="MTGGoldfish — Exact Card Versions">
                            <Text color="gray.600" mb={3}>
                                Use the <strong>Export</strong> button on a deck
                                page and choose one of the{' '}
                                <em>exact card versions</em> options (Tabletop,
                                MTG Arena, or Magic Online). Set codes appear in
                                brackets; optional treatment and foil suffixes
                                are stripped automatically.
                            </Text>
                            <CodeBlock>{`4 Lightning Bolt [M11]
4 Inquisition of Kozilek [ROE]
2 Stoneforge Mystic <OTJ Special Guest> [SPG]
1 Thalia, Guardian of Thraben [DKA] (F)

2 Nihil Spellbomb [SOM]`}</CodeBlock>
                            <SignalBox
                                signals={[
                                    'Set code in [BRACKETS] at end of name',
                                    'Optional <treatment> annotation is ignored',
                                    'Optional (F) or (FE) foil suffix is stripped',
                                    'Blank line separates main deck from sideboard'
                                ]}
                            />
                        </Section>

                        <Divider />

                        {/* MTGO .dek */}
                        <Section title="Magic Online — .dek Export">
                            <Text color="gray.600" mb={3}>
                                Export your deck as a <Code>.dek</Code> file
                                from Magic Online. The XML format carries MTGO
                                card IDs for the most precise lookup.
                            </Text>
                            <CodeBlock>{`<?xml version="1.0" encoding="utf-8"?>
<Deck>
  <Cards CatID="726" Quantity="1" Sideboard="false"
         Name="Command Tower" Annotation="0" />
  <Cards CatID="534" Quantity="4" Sideboard="false"
         Name="Lightning Bolt" Annotation="0" />
  <Cards CatID="142" Quantity="1" Sideboard="true"
         Name="Juri, Master of the Revue"
         Annotation="16777728" />
</Deck>`}</CodeBlock>
                            <SignalBox
                                signals={[
                                    'XML format with <Deck> root element',
                                    'CatID → MTGO ID lookup (3–4 digits only)',
                                    'Sideboard="true" → sideboard group',
                                    'Annotation=16777728 → commander group'
                                ]}
                            />
                            <Alert
                                status="warning"
                                borderRadius="md"
                                mt={3}
                                fontSize="sm"
                            >
                                <AlertIcon />
                                <AlertDescription>
                                    MTGO card IDs with 5 or more digits are not
                                    supported by the lookup API and will
                                    automatically fall back to a name-based
                                    search.
                                </AlertDescription>
                            </Alert>
                        </Section>

                        <Divider />

                        {/* Plain Text */}
                        <Section title="Plain Text">
                            <Text color="gray.600" mb={3}>
                                A simple quantity + name format supported by
                                most tools. Use <Code>SIDEBOARD:</Code> or a
                                blank line to separate main deck from sideboard.
                                If the last section contains exactly one card
                                line, it is treated as the commander.
                            </Text>
                            <CodeBlock>{`4 Lightning Bolt
4 Inquisition of Kozilek
2 Stoneforge Mystic

SIDEBOARD:
2 Nihil Spellbomb
1 Surgical Extraction`}</CodeBlock>
                            <SignalBox
                                signals={[
                                    'Lines start with quantity (4, 4x, x4)',
                                    'SIDEBOARD: / SB: / -- marks sideboard',
                                    'Blank line with single trailing card = commander',
                                    'Name-only lookup — any printing may be returned'
                                ]}
                            />
                        </Section>
                    </VStack>
                </Container>
            </Box>
            <Footer />
        </Box>
    )
}

// ─── Local helpers ────────────────────────────────────────────────────────────

function Section({
    title,
    badge,
    badgeColor,
    children
}: {
    title: string
    badge?: string
    badgeColor?: string
    children: React.ReactNode
}) {
    return (
        <Box>
            <HStack spacing={3} mb={4}>
                <Heading size="md" color="gray.800">
                    {title}
                </Heading>
                {badge && (
                    <Badge colorScheme={badgeColor ?? 'gray'}>{badge}</Badge>
                )}
            </HStack>
            {children}
        </Box>
    )
}

function CodeBlock({ children }: { children: string }) {
    return (
        <Box
            as="pre"
            bg="gray.900"
            color="gray.100"
            p={4}
            borderRadius="md"
            fontSize="sm"
            overflowX="auto"
            fontFamily="mono"
            mb={3}
            whiteSpace="pre"
        >
            {children}
        </Box>
    )
}

function SignalBox({ signals }: { signals: string[] }) {
    return (
        <Box
            bg="purple.50"
            border="1px solid"
            borderColor="purple.200"
            borderRadius="md"
            p={3}
        >
            <Text fontSize="xs" fontWeight="semibold" color="purple.700" mb={2}>
                Key parsing signals
            </Text>
            <VStack align="start" spacing={1}>
                {signals.map((s) => (
                    <Text key={s} fontSize="xs" color="purple.800">
                        • {s}
                    </Text>
                ))}
            </VStack>
        </Box>
    )
}

function FormatRow({
    format,
    source,
    identifier,
    commander
}: {
    format: string
    source: string
    identifier: string
    commander: string
}) {
    return (
        <Tr>
            <Td fontWeight="medium">{format}</Td>
            <Td color="gray.600">{source}</Td>
            <Td>
                <Code fontSize="sm">{identifier}</Code>
            </Td>
            <Td color="gray.600" fontSize="sm">
                {commander}
            </Td>
        </Tr>
    )
}
