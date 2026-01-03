"use client"

import { LogOut } from "lucide-react"
import { logout } from "@/lib/auth"
import { useRouter } from "next/navigation"

export function LogoutButton() {
    const router = useRouter()

    async function handleLogout() {
        await logout()
        router.push("/login")
        router.refresh()
    }

    return (
        <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group mt-2"
        >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span>Logout</span>
        </button>
    )
}
