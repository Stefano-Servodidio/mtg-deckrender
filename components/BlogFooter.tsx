'use client'

import { Text, VStack, HStack, Avatar, StackProps } from '@chakra-ui/react'
import { BlogPost } from '@/types/blog'

export default function BlogFooter({
    author,
    createdAt,
    ...props
}: Omit<StackProps, 'children'> & Pick<BlogPost, 'author' | 'createdAt'>) {
    return (
        <HStack spacing={3} {...props}>
            <Avatar size="sm" name={author.name} src={author.avatar} />
            <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="semibold">
                    {author.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                    {new Date(createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </Text>
            </VStack>
        </HStack>
    )
}
