import { Center, Spinner } from '@chakra-ui/react'

function Loading() {
    return (
        <Center h="100vh">
            <Spinner size="xl" color="purple.500" />
        </Center>
    )
}

export default Loading
