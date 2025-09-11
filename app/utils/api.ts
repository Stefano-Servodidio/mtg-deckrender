// Utility function to parse a decklist string and return unique cards with their quantities
export const getUniqueCards = (
    decklist: string,
    type: 'main' | 'sideboard'
) => {
    const cardStrings = decklist
        .split('\n')
        .map((line) => line.replace(' ', '#').trim())

    return cardStrings.reduce<
        { name: string; quantity: number; type: 'main' | 'sideboard' }[]
    >((acc, line) => {
        if (!line) {
            return acc
        }
        const [quantityStr, name] = line.split('#')
        const quantity = parseInt(quantityStr.replace('x', ''), 10)
        if (!isNaN(quantity) && quantity > 0 && name) {
            acc.push({ name, quantity, type })
        }
        return acc
    }, [])
}

// Utility function to pause execution for a given number of milliseconds
export const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))
