// svg overlay for card quantities

interface QuantityOverlayProps {
    quantity: number
    scale?: number
}

const QuantityOverlay: React.FC<QuantityOverlayProps> = ({
    quantity,
    scale = 1
}) => {
    if (quantity < 2) return null // No overlay for single cards

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={125 * scale}
            height={125 * scale}
            viewBox="0 0 125 125"
            role="img"
            aria-label={`x${quantity} box`}
        >
            {/* <defs>
                <style>
                    @import
                    url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700");
                </style>
            </defs> */}
            <rect
                x="0"
                y="0"
                width={125 * scale}
                height={125 * scale}
                rx="4"
                ry="4"
                fill="#000000"
            />
            <text
                x="50%"
                y="50%"
                fill="#FFFFFF"
                fontSize={60 * scale}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
            >
                x{quantity}
            </text>
        </svg>
    )
}

export default QuantityOverlay
