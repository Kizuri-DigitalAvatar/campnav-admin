"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, AlertCircle, Loader2 } from "lucide-react"
import { login } from "@/lib/auth"

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
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="w-full max-w-sm relative">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10 space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-extrabold text-3xl shadow-xl shadow-primary/10">
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
                <div className="bg-card border rounded-3xl p-8 shadow-sm">
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
                                    className="w-full px-4 h-12 rounded-xl border bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                                        className="w-full pl-11 h-12 rounded-xl border bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
                            className="w-full bg-primary text-primary-foreground font-bold h-12 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
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
