"use server"

import { cookies } from "next/headers"

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../convex/_generated/api"

const SESSION_COOKIE = "campnav_admin_session"
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function login(email: string, password: string) {
    try {
        const user = await client.query(api.users.verifyUser, { email, password })

        if (user && (user.role === "camp_manager" || user.role === "camp_supervisor")) {
            const cookieStore = await cookies()
            const sessionData = JSON.stringify({
                userId: user._id,
                role: user.role,
                name: user.name,
                email: user.email
            })
            
            cookieStore.set(SESSION_COOKIE, sessionData, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 24 hours
                path: "/",
            })
            return { success: true }
        }

        return { success: false, error: "Invalid credentials or insufficient permissions" }
    } catch (err) {
        console.error("Login error:", err)
        return { success: false, error: "Authentication failed" }
    }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated() {
    const cookieStore = await cookies()
    return cookieStore.has(SESSION_COOKIE)
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE)
    if (!session || !session.value) return null
    try {
        if (!session.value.startsWith('{')) return null
        return JSON.parse(session.value)
    } catch (e) {
        return null
    }
}
