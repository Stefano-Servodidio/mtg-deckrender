'use client'

import { BlogPost } from '@/types/blog'
import { Heading, VStack, Badge, HStack, StackProps } from '@chakra-ui/react'

export default function BlogHeader({
    title,
    tags,
    ...props
}: Omit<StackProps, 'children'> & Pick<BlogPost, 'title' | 'tags'>) {
    return (
        <VStack align="start" spacing={2} {...props}>
            <Heading size="md">{title}</Heading>
            <HStack spacing={2} flexWrap="wrap">
                {tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} colorScheme="purple" fontSize="xs">
                        {tag}
                    </Badge>
                ))}
            </HStack>
        </VStack>
    )
}
