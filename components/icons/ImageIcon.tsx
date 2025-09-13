'use client'
import { Icon, IconProps } from '@chakra-ui/react'
import { FaImage } from 'react-icons/fa'

const ImageIcon: React.FC<IconProps> = (props) => (
    <Icon as={FaImage} color="blue.500" {...props} />
)

export default ImageIcon
