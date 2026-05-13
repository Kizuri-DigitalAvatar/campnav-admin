"use client"

import { ReactNode, useMemo } from "react"
import { ConvexProvider, ConvexReactClient } from "convex/react"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    if (!convexUrl) return null
    return new ConvexReactClient(convexUrl)
  }, [])

  if (!convexUrl) {
    if (typeof window !== "undefined") {
      console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Convex will not work.")
    }
    return <>{children}</>
  }

  return <ConvexProvider client={client!}>{children}</ConvexProvider>
}
