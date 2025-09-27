import {
    Tabs as ChakraTabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    TabsProps as ChakraTabsProps
} from '@chakra-ui/react'

export interface TabsProps extends ChakraTabsProps {
    name: string
    tabs: { title: string; content: React.ReactNode }[]
}

const Tabs: React.FC<TabsProps> = ({ name, tabs }) => {
    return (
        <ChakraTabs variant="enclosed" w="full">
            <TabList>
                {tabs.map((tab, index) => (
                    <Tab key={`tabs-${name}-${index}`}>{tab.title}</Tab>
                ))}
            </TabList>
            <TabPanels>
                {tabs.map((tab, index) => (
                    <TabPanel key={`tabs-panel-${name}-${index}`}>
                        {tab.content}
                    </TabPanel>
                ))}
            </TabPanels>
        </ChakraTabs>
    )
}
export default Tabs
