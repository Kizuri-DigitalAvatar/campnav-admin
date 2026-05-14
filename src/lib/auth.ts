"use server"

import { cookies, headers } from "next/headers"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../convex/_generated/api"

const SESSION_COOKIE = "campnav_admin_session"
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

function parseUA(ua: string) {
    const browser =
        /Edg\//.test(ua) ? "Edge" :
        /OPR\/|Opera/.test(ua) ? "Opera" :
        /Chrome\//.test(ua) ? "Chrome" :
        /Firefox\//.test(ua) ? "Firefox" :
        /Safari\//.test(ua) ? "Safari" : "Unknown"

    const os =
        /Windows NT/.test(ua) ? "Windows" :
        /Mac OS X/.test(ua) ? "macOS" :
        /Android/.test(ua) ? "Android" :
        /iPhone|iPad/.test(ua) ? "iOS" :
        /Linux/.test(ua) ? "Linux" : "Unknown"

    const device =
        /iPhone/.test(ua) ? "iPhone" :
        /iPad/.test(ua) ? "iPad" :
        /Android/.test(ua) ? "Android" :
        /Mobile/.test(ua) ? "Mobile" : "Desktop"

    return { browser, os, device }
}

export async function login(email: string, password: string) {
    const headersList = await headers()
    const ip =
        headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
        headersList.get("x-real-ip") ??
        "unknown"
    const ua = headersList.get("user-agent") ?? ""
    const { browser, os, device } = parseUA(ua)

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
                maxAge: 60 * 60 * 24,
                path: "/",
            })

            await client.mutation(api.loginLogs.log, {
                userId: user._id as any,
                email,
                userName: user.name,
                role: user.role,
                app: "admin",
                status: "success",
                ipAddress: ip,
                userAgent: ua,
                browser,
                os,
                device,
            })

            return { success: true }
        }

        await client.mutation(api.loginLogs.log, {
            email,
            app: "admin",
            status: "failed",
            ipAddress: ip,
            userAgent: ua,
            browser,
            os,
            device,
        })

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
