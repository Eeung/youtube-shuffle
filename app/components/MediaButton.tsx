import Tooltip from "@/components/Tooltip"

type ChildrenProps = {
    innerText? : string
    onClick? : () => void
    className? : string
    tooltipContent?: string
}

export default function MediaButton({
    innerText,
    onClick,
    className,
    tooltipContent
}: ChildrenProps) {
    return (
        <div className = "group">
            <div
                onClick={onClick}
                className = {className}
                data-tooltip-target={innerText}
                data-tooltip-placement="bottom"
            >
                <span className="material-symbols-outlined">{innerText}</span>
            </div>
            {(innerText && tooltipContent) &&
                <Tooltip content={tooltipContent}/>
            }
        </div>
    )
}