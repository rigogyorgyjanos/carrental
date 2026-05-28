"use client"

import { usePathname } from "next/navigation"
import Navbar from "./Navbar"

export default function ConditionalNavbar() {
    const path = usePathname()
    if (path.startsWith("/admin") || path.startsWith("/moderator")) return null
    return <Navbar />
}
