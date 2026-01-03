"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, LayoutDashboard, AlertCircle, Loader2 } from "lucide-react"
import { login } from "@/lib/auth"

export default function LoginPage() {
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const result = await login(password)
            if (result.success) {
                router.push("/")
                router.refresh()
            } else {
                setError(result.error || "Password incorrect")
            }
        } catch (err) {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#030712]">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                        <LayoutDashboard size={32} className="text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-indigo-100">
                            CAMPNAV Admin
                        </h1>
                        <p className="text-blue-200/40 text-sm mt-1">Management Portal Authentication</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-blue-200/60 ml-1 block">
                                Administrative Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-200/40 group-focus-within:text-indigo-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    autoFocus
                                    className="glass-input w-full pl-11 bg-indigo-950/20 focus:bg-indigo-950/40 transition-all text-blue-50 placeholder:text-blue-200/20"
                                    placeholder="Enter your password..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="glass-button w-full bg-indigo-600/50 hover:bg-indigo-600/70 text-white font-semibold py-3 flex items-center justify-center gap-2 group transition-all h-[52px]"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>Authenticate</span>
                                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white">
                                            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">
                            Secure Access Protocol v1.0
                        </p>
                    </div>
                </div>

                {/* Footer Link */}
                <p className="mt-8 text-center text-sm text-blue-200/20">
                    Difficulty logging in? Contact system administrator.
                </p>
            </div>
        </div>
    )
}
