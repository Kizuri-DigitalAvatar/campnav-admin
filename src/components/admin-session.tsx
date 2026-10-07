"use client"

import { createContext, useContext } from "react"

export type AdminSession = { userId?: string; role?: string; name?: string; email?: string } | null

// The signed-in admin, as read from the session cookie by the root layout
export const AdminSessionContext = createContext<AdminSession>(null)

export function useAdminSession() {
    return useContext(AdminSessionContext)
}
