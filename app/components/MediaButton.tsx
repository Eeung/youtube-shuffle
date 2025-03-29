type ChildrenProps = {
    innerText? : string
    onClick? : () => void
    className? : string
}

export default function MediaButton({
    innerText,
    onClick,
    className
}: ChildrenProps) {
    return (
        <div
            onClick={onClick}
            className = {className}
        >
            <span className="material-symbols-outlined">{innerText}</span>
        </div>
    )
}