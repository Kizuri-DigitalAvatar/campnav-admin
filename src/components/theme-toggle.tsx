"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle({ className }: { className?: string }) {
    const [isDark, setIsDark] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"))
        setMounted(true)
    }, [])

    const toggle = () => {
        const next = !isDark
        setIsDark(next)
        document.documentElement.classList.toggle("dark", next)
        try {
            localStorage.setItem("campnav-theme", next ? "dark" : "light")
        } catch { }
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`relative h-10 w-10 rounded-xl tile-3d flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 ${className || ""}`}
        >
            {/* Render both icons and cross-fade to avoid a hydration flash */}
            <Sun
                size={16}
                className={`absolute transition-all duration-300 ${mounted && isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`}
            />
            <Moon
                size={16}
                className={`absolute transition-all duration-300 ${mounted && isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`}
            />
        </button>
    )
}
