'use client'
import { Icon, IconProps } from '@chakra-ui/react'
import { FaDownload } from 'react-icons/fa'

const DownloadIcon: React.FC<IconProps> = (props) => (
    <Icon as={FaDownload} color="purple.500" {...props} />
)

export default DownloadIcon
