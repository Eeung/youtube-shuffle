type TooltipData ={
    content:string
}

export default function Tooltip({
    content
}: TooltipData){
    return (
        <span
            className="-translate-x-1/2 z-10 absolute invisible inline-block px-3 py-2 text-xs font-medium text-white bg-[rgba(0,0,0,0.7)] rounded-lg shadow-xs opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity"
        >
            {content}
        </span>
    )
}