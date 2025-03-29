import { ReactNode } from "react";

type ChildrenNodes = {
    children : ReactNode
}

export default function MainSection({children} : ChildrenNodes){
    return (
        <main className = "flex grow justify-center items-center w-screen h-px">
            <article className="flex flex-col bg-gray-300 w-5/6 h-11/12 px-4 rounded-2xl max-w-7xl">
                {children}
            </article>
        </main>
    )
}