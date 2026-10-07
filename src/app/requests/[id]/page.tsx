"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { toast } from "sonner"
import {
    AlertTriangle, ArrowLeft, Bell, BellRing, Briefcase, CheckCircle2, Clock, Eye,
    Loader2, MapPin, Plane, UserCheck, UserX, Users,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Availability = "available" | "busy" | "on_leave" | "off_site"
type Engagement = "accepted" | "viewed_ignored" | "seen_ignored" | "popup_ignored" | "not_seen" | "not_notified"

const AVAILABILITY: Record<Availability, { label: string; className: string; icon: React.ElementType }> = {
    available: { label: "Available", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
    busy: { label: "Busy", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Briefcase },
    on_leave: { label: "On Leave", className: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Plane },
    off_site: { label: "Off Site", className: "bg-muted text-muted-foreground border-border", icon: MapPin },
}

const ENGAGEMENT: Record<Engagement, { label: string; className: string }> = {
    accepted: { label: "Accepted", className: "text-emerald-600" },
    viewed_ignored: { label: "Saw the task, didn't accept", className: "text-red-600" },
    seen_ignored: { label: "Read notification, didn't accept", className: "text-red-600" },
    popup_ignored: { label: "Got the popup, didn't accept", className: "text-amber-600" },
    not_seen: { label: "Notified, not seen yet", className: "text-muted-foreground" },
    not_notified: { label: "Not notified", className: "text-muted-foreground/60" },
}

const FILTERS = [
    { key: "all", label: "All Staff" },
    { key: "matched", label: "Right Duty" },
    { key: "available", label: "Available" },
    { key: "ignored", label: "Ignored It" },
] as const

function fmt(ts?: number) {
    if (!ts) return null
    return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function since(ts: number) {
    const m = Math.floor((Date.now() - ts) / 60000)
    if (m < 1) return "just now"
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ${m % 60}m`
    return `${Math.floor(h / 24)}d`
}

const label = (s: string) => s.replaceAll("_", " ")

export default function RequestStaffingPage() {
    const { id } = useParams<{ id: string }>()
    const report = useQuery(api.requests.getStaffingReport, { id: id as Id<"requests"> })
    const assignStaff = useMutation(api.tasks.assignStaffToRequest)

    const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all")
    const [assigningId, setAssigningId] = useState<string | null>(null)

    const visibleStaff = useMemo(() => {
        const all = report?.staff ?? []
        switch (filter) {
            case "matched": return all.filter((s) => s.dutyMatch)
            case "available": return all.filter((s) => s.availability === "available")
            case "ignored": return all.filter((s) => ["viewed_ignored", "seen_ignored", "popup_ignored"].includes(s.engagement))
            default: return all
        }
    }, [report, filter])

    async function handleAssign(staffId: Id<"users">, name: string) {
        setAssigningId(staffId)
        try {
            await assignStaff({ requestId: id as Id<"requests">, staffId })
            toast.success(`Assigned to ${name}`, { description: "They have been notified." })
        } catch (err: any) {
            toast.error("Could not assign", { description: err?.message })
        } finally {
            setAssigningId(null)
        }
    }

    if (report === undefined) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-40 rounded-3xl" />
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
                </div>
                <Skeleton className="h-96 rounded-3xl" />
            </div>
        )
    }

    if (report === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <AlertTriangle className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Request not found</p>
                <Link href="/requests" className="text-sm font-semibold text-primary">← Back to Requests</Link>
            </div>
        )
    }

    const { request, task, assignee, summary } = report
    const isClosed = ["completed", "cancelled", "rejected"].includes(request.status)
    const accepted = !!task && task.status !== "pending" && !!task.staffId
    const waitingSince = report.alertedAt ?? task?.assignedAt ?? request.createdAt

    // One-line diagnosis of why nobody has picked this up
    let diagnosis: string
    if (isClosed) diagnosis = `This request is ${label(request.status)}.`
    else if (accepted) diagnosis = `${assignee?.name ?? "A staff member"} accepted this task ${task?.acknowledgedAt ? `at ${fmt(task.acknowledgedAt)}` : ""}.`
    else if (summary.total === 0) diagnosis = "There are no staff accounts. Add staff on the Users page."
    else if (summary.dutyMatched === 0) diagnosis = `No staff member has ${label(report.dutyType)} duties. Assign someone with another duty, or add the duty on the Users page.`
    else if (summary.availableMatched === 0) diagnosis = `All ${summary.dutyMatched} ${label(report.dutyType)} staff are busy, on leave or off site.`
    else if (summary.ignored > 0) diagnosis = `${summary.ignored} staff saw this request but nobody accepted it.`
    else diagnosis = `${summary.availableMatched} ${label(report.dutyType)} staff are free but haven't responded yet.`

    const stats = [
        { label: "Right Duty", value: summary.dutyMatched, sub: `of ${summary.total} staff`, icon: Users },
        { label: "Available Now", value: summary.availableMatched, sub: `${summary.available} available overall`, icon: UserCheck },
        { label: "Busy / Away", value: summary.busy + summary.onLeave + summary.offSite, sub: `${summary.busy} busy · ${summary.onLeave} leave · ${summary.offSite} off site`, icon: UserX },
        { label: "Seen & Ignored", value: summary.ignored, sub: `${summary.notified} notified`, icon: Eye },
    ]

    return (
        <div className="space-y-6 md:space-y-8">
            <Link href="/requests" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Requests
            </Link>

            {/* ── Request summary ── */}
            <div className="glass-card rounded-3xl overflow-hidden">
                <div className={`h-1 w-full ${accepted || isClosed ? "bg-emerald-500" : "bg-destructive"}`} />
                <div className="p-6 md:p-8 space-y-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                                    {label(request.type)}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                                    {label(request.status)}
                                </span>
                                {request.priority && (
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${request.priority === "urgent" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}`}>
                                        {request.priority}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Room {request.roomNumber}</h2>
                            <p className="text-xs text-muted-foreground">
                                From <span className="font-bold text-foreground">{request.requesterName}</span> · {fmt(request.createdAt)}
                            </p>
                        </div>
                        {!isClosed && !accepted && (
                            <div className="flex items-center gap-2 text-xs font-bold text-destructive bg-destructive/10 px-3 py-2 rounded-xl shrink-0">
                                <Clock className="w-4 h-4" />
                                Waiting {since(waitingSince)}
                            </div>
                        )}
                    </div>

                    <p className="text-sm italic text-foreground/80 border-l-2 border-primary/30 pl-3">"{request.description}"</p>

                    <div className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-medium ${accepted || isClosed ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                        {accepted || isClosed ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                        <div className="space-y-1">
                            <p>{diagnosis}</p>
                            {!accepted && assignee && (
                                <p className="text-xs opacity-80">Currently offered to {assignee.name}, who hasn't accepted yet.</p>
                            )}
                            {report.alertedAt && (
                                <p className="text-xs opacity-80">Admins were alerted at {fmt(report.alertedAt)}.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                    <div key={s.label} className="glass-card rounded-3xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <s.icon className="w-4 h-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                        </div>
                        <p className="text-3xl font-black font-mono tabular-nums">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Staff list ── */}
            <div className="glass-card rounded-3xl overflow-hidden">
                <div className="p-5 md:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black tracking-tight">Staff Availability</h3>
                        <p className="text-xs text-muted-foreground">Who could take this request, and what happened when they were notified.</p>
                    </div>
                    <div className="flex gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setFilter(f.key)}
                                className={`px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${filter === f.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {visibleStaff.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">No staff match this filter.</div>
                ) : (
                    <ul className="divide-y">
                        {visibleStaff.map((s) => {
                            const avail = AVAILABILITY[s.availability as Availability]
                            const eng = ENGAGEMENT[s.engagement as Engagement]
                            const canAssign = !isClosed && !(s.isAssignee && accepted)
                            return (
                                <li key={s._id} className={`p-5 md:p-6 space-y-4 ${s.isAssignee ? "bg-primary/5" : ""}`}>
                                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                                    {/* Identity */}
                                    <div className="flex items-center gap-4 lg:w-64 shrink-0">
                                        <div className="w-11 h-11 rounded-full border bg-muted overflow-hidden flex items-center justify-center shrink-0">
                                            {s.imageUrl
                                                ? <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                                                : <span className="font-black text-sm text-muted-foreground">{(s.name || "?")[0].toUpperCase()}</span>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">
                                                {s.name}
                                                {s.isAssignee && <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-primary">Offered</span>}
                                            </p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {s.assignedDuties.length === 0
                                                    ? <span className="text-[10px] text-muted-foreground">No duties set</span>
                                                    : s.assignedDuties.map((d: string) => (
                                                        <span key={d} className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${d === report.dutyType ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                            {label(d)}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Availability + reasons */}
                                    <div className="lg:w-72 shrink-0 space-y-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${avail.className}`}>
                                            <avail.icon className="w-3 h-3" /> {avail.label}
                                        </span>
                                        {s.reasons.length > 0 && (
                                            <ul className="space-y-0.5">
                                                {s.reasons.map((r: string) => (
                                                    <li key={r} className="text-xs text-muted-foreground">• {r}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Engagement with this request */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <p className={`text-xs font-black uppercase tracking-widest ${eng.className}`}>{eng.label}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                            <Step done={!!s.notifiedAt} icon={Bell} text={s.notifiedAt ? `Notified ${fmt(s.notifiedAt)}` : "Not notified"} />
                                            {s.notifiedAt && <Step done={!!s.popupShownAt} icon={BellRing} text={s.popupShownAt ? `Popup ${fmt(s.popupShownAt)}` : "Popup not shown"} />}
                                            {s.notifiedAt && <Step done={!!s.notificationReadAt} icon={Eye} text={s.notificationReadAt ? `Read ${fmt(s.notificationReadAt)}` : "Not read"} />}
                                            <Step done={s.viewedTask} icon={Eye} text={s.viewedTask ? "Saw the task" : "Hasn't seen task"} />
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="shrink-0">
                                        {canAssign ? (
                                            <button
                                                type="button"
                                                disabled={assigningId !== null}
                                                onClick={() => handleAssign(s._id, s.name)}
                                                className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 inline-flex items-center gap-2 ${s.availability === "available" && s.dutyMatch ? "bg-primary text-primary-foreground hover:opacity-90" : "border bg-card hover:bg-muted"}`}
                                            >
                                                {assigningId === s._id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                {s.isAssignee ? "Re-send" : "Assign"}
                                            </button>
                                        ) : s.isAssignee && accepted ? (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">On it</span>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Their other open tasks */}
                                {s.openTasks.length > 0 && (
                                    <div className="lg:pl-[60px] space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Current tasks ({s.openTasks.length})
                                        </p>
                                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                            {s.openTasks.map((t: any) => <TaskChip key={t._id} task={t} />)}
                                        </div>
                                    </div>
                                )}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </div>
    )
}

const TASK_STATUS: Record<string, { label: string; className: string }> = {
    pending: { label: "Not accepted", className: "bg-muted text-muted-foreground" },
    acknowledged: { label: "Accepted", className: "bg-amber-500/10 text-amber-600" },
    confirmed: { label: "Accepted", className: "bg-amber-500/10 text-amber-600" },
    in_progress: { label: "In progress", className: "bg-blue-500/10 text-blue-600" },
}

function TaskChip({ task }: { task: any }) {
    const status = TASK_STATUS[task.status] ?? { label: label(task.status), className: "bg-muted text-muted-foreground" }
    const when = task.startedAt
        ? `Started ${fmt(task.startedAt)}`
        : task.acknowledgedAt ? `Accepted ${fmt(task.acknowledgedAt)}` : `Offered ${fmt(task.assignedAt)}`
    const body = (
        <>
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black truncate">
                    Room {task.roomNumber} · <span className="capitalize">{label(task.serviceType)}</span>
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${status.className}`}>
                    {status.label}
                </span>
            </div>
            {task.description && <p className="text-[11px] text-muted-foreground truncate">{task.description}</p>}
            <p className="text-[10px] text-muted-foreground/70">{when}</p>
        </>
    )
    const base = `block rounded-xl border p-3 space-y-1 ${task.accepted ? "bg-card" : "bg-muted/30 border-dashed"}`
    return task.requestId ? (
        <Link href={`/requests/${task.requestId}`} className={`${base} hover:border-primary/50 hover:shadow-sm transition-all`}>
            {body}
        </Link>
    ) : (
        <div className={base}>{body}</div>
    )
}

function Step({ done, icon: Icon, text }: { done: boolean; icon: React.ElementType; text: string }) {
    return (
        <span className={`inline-flex items-center gap-1 ${done ? "text-foreground font-semibold" : "opacity-60"}`}>
            <Icon className="w-3 h-3" /> {text}
        </span>
    )
}
