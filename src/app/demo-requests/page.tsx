"use client"

import { useState, useMemo } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { toast } from "sonner"
import {
    Sparkles, Search, Mail, Phone, Building2, Trash2,
    Clock, CheckCircle2, CalendarCheck, Trophy, XCircle, MessageSquare
} from "lucide-react"

const STATUSES = [
    { key: "new", label: "New", icon: Sparkles, color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
    { key: "contacted", label: "Contacted", icon: CheckCircle2, color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    { key: "scheduled", label: "Scheduled", icon: CalendarCheck, color: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
    { key: "won", label: "Won", icon: Trophy, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    { key: "closed", label: "Closed", icon: XCircle, color: "bg-muted text-muted-foreground border-border" },
]

const statusMeta = (key: string) => STATUSES.find((s) => s.key === key) ?? STATUSES[0]

function FilterChip({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:border-border"
                }`}
        >
            {label}
            {count !== undefined && <span className="ml-1.5 opacity-70">{count}</span>}
        </button>
    )
}

export default function DemoRequestsPage() {
    const leads = useQuery(api.demoRequests.list, {}) ?? []
    const updateStatus = useMutation(api.demoRequests.updateStatus)
    const removeLead = useMutation(api.demoRequests.remove)

    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)

    const filtered = useMemo(() => {
        const term = search.toLowerCase()
        return leads.filter((lead: any) => {
            const matchSearch =
                !term ||
                lead.fullName?.toLowerCase().includes(term) ||
                lead.workEmail?.toLowerCase().includes(term) ||
                lead.company?.toLowerCase().includes(term) ||
                lead.message?.toLowerCase().includes(term)
            const matchStatus = !statusFilter || lead.status === statusFilter
            return matchSearch && matchStatus
        })
    }, [leads, search, statusFilter])

    const counts = useMemo(() => {
        const map: Record<string, number> = {}
        for (const lead of leads as any[]) map[lead.status] = (map[lead.status] ?? 0) + 1
        return map
    }, [leads])

    const handleStatus = async (id: Id<"demoRequests">, status: string) => {
        try {
            await updateStatus({ id, status })
            toast.success(`Marked as ${statusMeta(status).label.toLowerCase()}`)
        } catch {
            toast.error("Could not update this request")
        }
    }

    const handleDelete = async (id: Id<"demoRequests">, name: string) => {
        if (!confirm(`Delete the demo request from ${name}? This cannot be undone.`)) return
        try {
            await removeLead({ id })
            toast.success("Demo request deleted")
        } catch {
            toast.error("Could not delete this request")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Demo Requests
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Leads submitted through the public landing page at <code className="text-xs">/contact</code>.
                    </p>
                </div>
                <div className="rounded-2xl border bg-card px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
                    <p className="text-2xl font-black leading-none mt-1">{leads.length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, company…"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border bg-card text-sm outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <FilterChip label="All" count={leads.length} active={!statusFilter} onClick={() => setStatusFilter(null)} />
                    {STATUSES.map((status) => (
                        <FilterChip
                            key={status.key}
                            label={status.label}
                            count={counts[status.key] ?? 0}
                            active={statusFilter === status.key}
                            onClick={() => setStatusFilter(status.key)}
                        />
                    ))}
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
                    {leads.length === 0
                        ? "No demo requests yet. They will appear here as soon as someone submits the form."
                        : "No demo requests match these filters."}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((lead: any) => {
                        const meta = statusMeta(lead.status)
                        const Icon = meta.icon
                        return (
                            <div key={lead._id} className="rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-base font-bold tracking-tight">{lead.fullName}</h2>
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${meta.color}`}>
                                                <Icon className="w-3 h-3" />
                                                {meta.label}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5" />
                                                {lead.company}
                                                {lead.jobTitle ? ` · ${lead.jobTitle}` : ""}
                                            </span>
                                            <a href={`mailto:${lead.workEmail}`} className="flex items-center gap-1.5 hover:text-foreground">
                                                <Mail className="w-3.5 h-3.5" />
                                                {lead.workEmail}
                                            </a>
                                            {lead.phone && (
                                                <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {lead.phone}
                                                </a>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(lead.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={lead.status}
                                            onChange={(e) => handleStatus(lead._id, e.target.value)}
                                            className="h-9 rounded-lg border bg-background px-2.5 text-xs font-medium outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
                                        >
                                            {STATUSES.map((status) => (
                                                <option key={status.key} value={status.key}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleDelete(lead._id, lead.fullName)}
                                            className="h-9 w-9 flex items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                                            aria-label={`Delete request from ${lead.fullName}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {(lead.campSize || lead.interests?.length || lead.preferredTime) && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {lead.campSize && (
                                            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-muted/60">{lead.campSize}</span>
                                        )}
                                        {lead.preferredTime && (
                                            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-muted/60">
                                                Prefers: {lead.preferredTime}
                                            </span>
                                        )}
                                        {lead.interests?.map((interest: string) => (
                                            <span key={interest} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {lead.message && (
                                    <div className="mt-4 flex gap-2.5 rounded-xl bg-muted/40 p-3.5">
                                        <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
                                        <p className="text-sm leading-relaxed whitespace-pre-line">{lead.message}</p>
                                    </div>
                                )}

                                {lead.notes && (
                                    <p className="mt-3 text-[11px] text-muted-foreground italic">{lead.notes}</p>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
