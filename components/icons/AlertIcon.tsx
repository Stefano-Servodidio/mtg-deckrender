'use client'
import { Icon, IconProps } from '@chakra-ui/react'
import { FaExclamationTriangle } from 'react-icons/fa'

const AlertIcon: React.FC<IconProps> = (props) => (
    <Icon as={FaExclamationTriangle} color="purple.500" {...props} />
)

export default AlertIcon
