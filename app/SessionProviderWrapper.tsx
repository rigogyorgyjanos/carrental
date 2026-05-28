"use client"

import { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"

export default function SessionProviderWrapper({ children }: { children: ReactNode }) {
    return <SessionProvider refetchInterval={120}>{children}</SessionProvider>
}