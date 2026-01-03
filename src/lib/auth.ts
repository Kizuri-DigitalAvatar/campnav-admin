"use server"

import { cookies } from "next/headers"

const SESSION_COOKIE = "campnav_admin_session"

export async function login(password: string) {
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
        console.error("ADMIN_PASSWORD is not defined in environment variables")
        return { success: false, error: "System configuration error" }
    }

    if (password === adminPassword) {
        const cookieStore = await cookies()
        cookieStore.set(SESSION_COOKIE, "authenticated", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        })
        return { success: true }
    }

    return { success: false, error: "Invalid password" }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated() {
    const cookieStore = await cookies()
    return cookieStore.has(SESSION_COOKIE)
}
