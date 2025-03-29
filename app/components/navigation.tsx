'use client'
import { useRouter } from "next/navigation"

export default function Navigation() {
    const router = useRouter()
    return (
        <nav className="flex w-full justify-between py-1 px-2.5 border-b-2">
        <h1 
          className="text-xl sm:text-2xl font-bold hover:underline"
          onClick={() => router.push('/')}
        >
          <span className="hidden sm:inline">YouTube </span>Playlist Shuffle
        </h1>
      </nav>
    )
}