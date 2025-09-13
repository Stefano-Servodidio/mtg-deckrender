'use client'
import { Icon, IconProps } from '@chakra-ui/react'
import { FaUpload } from 'react-icons/fa'

const UploadIcon: React.FC<IconProps> = (props) => (
    <Icon as={FaUpload} color="orange.500" {...props} />
)

export default UploadIcon
