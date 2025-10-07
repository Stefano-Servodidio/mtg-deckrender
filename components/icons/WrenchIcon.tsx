'use client'
import { Icon, IconProps } from '@chakra-ui/react'
import { FaWrench } from 'react-icons/fa'

const WrenchIcon: React.FC<IconProps> = (props) => (
    <Icon as={FaWrench} color="purple.500" {...props} />
)

export default WrenchIcon
