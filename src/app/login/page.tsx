"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, AlertCircle, Loader2 } from "lucide-react"
import { login } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const result = await login(email, password)
            if (result.success) {
                router.push("/")
                router.refresh()
            } else {
                setError(result.error || "Invalid credentials")
            }
        } catch (err) {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background dot-grid relative overflow-hidden">
            <div className="absolute top-6 right-6 z-10">
                <ThemeToggle />
            </div>

            {/* Floating decorative tiles, like the reference hero */}
            <div className="absolute top-[14%] left-[12%] w-16 h-16 rounded-2xl tile-3d hidden lg:flex items-center justify-center opacity-80 animate-float" style={{ "--tile-rot": "-8deg" } as React.CSSProperties} aria-hidden="true">
                <Lock size={24} className="text-primary" />
            </div>
            <div className="absolute bottom-[18%] right-[14%] w-14 h-14 rounded-2xl tile-3d hidden lg:flex items-center justify-center opacity-80 animate-float" style={{ "--tile-rot": "10deg", animationDelay: "-2s" } as React.CSSProperties} aria-hidden="true">
                <div className="w-6 h-6 rounded-lg tile-3d-primary" />
            </div>
            <div className="absolute top-[22%] right-[20%] w-10 h-10 rounded-xl tile-3d hidden lg:block opacity-60 animate-float" style={{ "--tile-rot": "6deg", animationDelay: "-4s" } as React.CSSProperties} aria-hidden="true" />
            <div className="absolute bottom-[24%] left-[18%] w-8 h-8 rounded-lg tile-3d hidden lg:block opacity-60 animate-float" style={{ "--tile-rot": "-12deg", animationDelay: "-1s" } as React.CSSProperties} aria-hidden="true" />

            <div className="w-full max-w-sm relative">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl tile-3d-primary text-primary-foreground font-extrabold text-2xl">
                        CN
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight">
                            CAMPNAV Admin
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Management Portal</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="glass-card rounded-3xl p-8 shadow-float">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 block">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    className="w-full px-4 h-12 rounded-xl border border-input bg-card shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.04)] focus:border-ring focus:ring-4 focus:ring-ring/15 transition-all duration-200 outline-none"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 block">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-foreground transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-11 h-12 rounded-xl border border-input bg-card shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.04)] focus:border-ring focus:ring-4 focus:ring-ring/15 transition-all duration-200 outline-none"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 hover:-translate-y-px transition-all duration-200 active:translate-y-0 active:scale-[0.99] disabled:opacity-60"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t text-center">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                            Secure Access Protocol
                        </p>
                    </div>
                </div>

                {/* Footer Link */}
                <p className="mt-10 text-center text-xs text-muted-foreground tracking-tight">
                    Authorized personnel only. All access is logged.
                </p>
            </div>
        </div>
    )
}
