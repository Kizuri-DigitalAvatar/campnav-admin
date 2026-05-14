"use client"

import { useState, useMemo } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { toast } from "sonner"
import {
    Shield, Search, SlidersHorizontal, X,
    Monitor, Smartphone, Tablet, Globe,
    CheckCircle2, XCircle, Trash2, RotateCcw
} from "lucide-react"

const APP_COLORS: Record<string, string> = {
    admin: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    client: "bg-blue-500/15 text-blue-400 border-blue-500/20",
}

const STATUS_COLORS: Record<string, string> = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    failed: "bg-red-500/15 text-red-400 border-red-500/20",
}

function DeviceIcon({ device }: { device?: string }) {
    const d = device?.toLowerCase() ?? ""
    if (d === "iphone" || d === "android" || d === "mobile") return <Smartphone className="w-4 h-4" />
    if (d === "ipad") return <Tablet className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:border-border"
                }`}
        >
            {label}
        </button>
    )
}

export default function LoginLogsPage() {
    const logs = useQuery(api.loginLogs.list, {}) ?? []
    const removeMutation = useMutation(api.loginLogs.remove)
    const clearAllMutation = useMutation(api.loginLogs.clearAll)

    const [search, setSearch] = useState("")
    const [appFilter, setAppFilter] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

    const filtered = useMemo(() => {
        return logs.filter((l: any) => {
            const matchSearch = !search ||
                l.email?.toLowerCase().includes(search.toLowerCase()) ||
                l.userName?.toLowerCase().includes(search.toLowerCase()) ||
                l.ipAddress?.includes(search) ||
                l.browser?.toLowerCase().includes(search.toLowerCase()) ||
                l.device?.toLowerCase().includes(search.toLowerCase())
            const matchApp = !appFilter || l.app === appFilter
            const matchStatus = !statusFilter || l.status === statusFilter
            return matchSearch && matchApp && matchStatus
        })
    }, [logs, search, appFilter, statusFilter])

    const successCount = logs.filter((l: any) => l.status === "success").length
    const failedCount = logs.filter((l: any) => l.status === "failed").length
    const adminCount = logs.filter((l: any) => l.app === "admin").length
    const clientCount = logs.filter((l: any) => l.app === "client").length

    async function handleRemove(id: Id<"loginLogs">) {
        try {
            await removeMutation({ id })
            toast.success("Log entry removed")
        } catch {
            toast.error("Failed to remove log entry")
        }
    }

    async function handleClearAll() {
        try {
            await clearAllMutation({})
            toast.success("All login logs cleared")
        } catch {
            toast.error("Failed to clear logs")
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Login Logs</h1>
                        <p className="text-sm text-muted-foreground mt-1">All device sessions across admin and client apps</p>
                    </div>
                </div>
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear All
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Logins", value: logs.length, color: "text-foreground" },
                    { label: "Successful", value: successCount, color: "text-emerald-400" },
                    { label: "Failed", value: failedCount, color: "text-red-400" },
                    { label: "Admin / Client", value: `${adminCount} / ${clientCount}`, color: "text-purple-400" },
                ].map(stat => (
                    <div key={stat.label} className="bg-card border rounded-2xl p-5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                {/* Filters */}
                <div className="px-5 pt-5 pb-4 border-b space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by email, name, IP, browser, device…"
                            className="w-full h-9 pl-8 pr-8 rounded-xl border bg-muted/50 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                        <FilterChip label="Admin" active={appFilter === "admin"} onClick={() => setAppFilter(appFilter === "admin" ? null : "admin")} />
                        <FilterChip label="Client" active={appFilter === "client"} onClick={() => setAppFilter(appFilter === "client" ? null : "client")} />
                        <span className="text-muted-foreground/30 text-[10px]">|</span>
                        <FilterChip label="Success" active={statusFilter === "success"} onClick={() => setStatusFilter(statusFilter === "success" ? null : "success")} />
                        <FilterChip label="Failed" active={statusFilter === "failed"} onClick={() => setStatusFilter(statusFilter === "failed" ? null : "failed")} />
                        <span className="ml-auto text-[10px] font-bold text-muted-foreground">{filtered.length} entries</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 border-b text-muted-foreground uppercase text-[10px] tracking-widest font-black">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">App</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">IP Address</th>
                                <th className="p-4">Device</th>
                                <th className="p-4">Browser / OS</th>
                                <th className="p-4">Time</th>
                                <th className="p-4 text-right w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filtered.map((l: any) => (
                                <tr key={l._id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                                                {(l.userName ?? l.email)?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{l.userName ?? "—"}</p>
                                                <p className="text-[10px] text-muted-foreground">{l.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${APP_COLORS[l.app] ?? "bg-muted text-muted-foreground border-transparent"}`}>
                                            {l.app}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-0.5 rounded border w-fit ${STATUS_COLORS[l.status] ?? ""}`}>
                                            {l.status === "success"
                                                ? <CheckCircle2 className="w-3 h-3" />
                                                : <XCircle className="w-3 h-3" />
                                            }
                                            {l.status}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground">
                                            <Globe className="w-3.5 h-3.5 shrink-0" />
                                            {l.ipAddress ?? "—"}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                            <DeviceIcon device={l.device} />
                                            {l.device ?? "—"}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs font-bold">{l.browser ?? "—"}</p>
                                        <p className="text-[10px] text-muted-foreground">{l.os ?? "—"}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-xs font-bold">
                                            {new Date(l.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleRemove(l._id)}
                                            className="p-2 rounded-xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="p-20 text-center bg-muted/20 border-t border-dashed">
                        <Shield className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase italic">
                            {logs.length === 0 ? "No login activity recorded yet" : "No entries match your filters"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
