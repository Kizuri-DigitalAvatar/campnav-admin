"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import {
    Trash2, ClipboardList, Bed, Wrench, Eraser,
    ChevronRight, CheckCircle2, Clock, AlertCircle, Users, Inbox
} from "lucide-react"

const PRIORITY_STYLES: Record<string, string> = {
    urgent: "bg-red-500/15 text-red-400 border-red-500/20",
    important: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    low: "bg-blue-500/15 text-blue-400 border-blue-500/20",
}

const STATUS_STYLES: Record<string, string> = {
    rated: "bg-primary/20 text-primary border-primary/20",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/20",
    in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/20",
    pending: "bg-white/5 text-blue-200/60 border-white/10",
}

function ServiceIcon({ type }: { type: string }) {
    const t = type.toLowerCase()
    if (t.includes("maint")) return <Wrench className="w-3.5 h-3.5" />
    if (t.includes("laundry")) return <Eraser className="w-3.5 h-3.5" />
    return <Bed className="w-3.5 h-3.5" />
}

export default function TasksPage() {
    const pendingRequests = useQuery(api.requests.list, { status: "pending" }) ?? []
    const allUsers = useQuery(api.users.listAll) ?? []
    const assignments = useQuery(api.tasks.list) ?? []

    const assignStaff = useMutation(api.tasks.assignStaffToRequest)
    const removeMutation = useMutation(api.tasks.remove)

    const staff = allUsers.filter((u: any) => u.role === "camp-staff" || u.role === "staff")

    const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
    const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
    const [assigning, setAssigning] = useState(false)

    async function handleAssign() {
        if (!selectedRequest || !selectedStaff) return
        setAssigning(true)
        try {
            await assignStaff({
                requestId: selectedRequest as Id<"requests">,
                staffId: selectedStaff as Id<"users">,
            })
            setSelectedRequest(null)
            setSelectedStaff(null)
        } finally {
            setAssigning(false)
        }
    }

    const canAssign = selectedRequest && selectedStaff

    return (
        <div className="space-y-8 md:space-y-10">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                    <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-sm text-muted-foreground mt-1">Assign staff to incoming requests</p>
                </div>
            </div>

            {/* Assignment builder */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">

                {/* Pending requests */}
                <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pending Requests</span>
                        <span className="ml-auto text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {pendingRequests.length}
                        </span>
                    </div>
                    <div className="divide-y max-h-[420px] overflow-y-auto">
                        {pendingRequests.length === 0 && (
                            <div className="p-10 text-center text-muted-foreground/40 text-xs font-bold uppercase tracking-widest">
                                No pending requests
                            </div>
                        )}
                        {pendingRequests.map((req: any) => {
                            const selected = selectedRequest === req._id
                            return (
                                <button
                                    key={req._id}
                                    onClick={() => setSelectedRequest(selected ? null : req._id)}
                                    className={`w-full text-left px-5 py-4 transition-colors group ${selected
                                        ? "bg-primary/10 border-l-2 border-primary"
                                        : "hover:bg-muted/40 border-l-2 border-transparent"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="p-1 rounded-md bg-muted text-foreground">
                                                    <ServiceIcon type={req.type} />
                                                </div>
                                                <span className="text-sm font-bold truncate">{req.userName}</span>
                                                <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded-md border shrink-0">
                                                    {req.roomNumber}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate pl-7">{req.description}</p>
                                            <div className="flex items-center gap-2 mt-2 pl-7">
                                                <span className="text-[10px] capitalize font-bold text-muted-foreground">{req.type.replace("_", " ")}</span>
                                                {req.priority && (
                                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[req.priority] ?? PRIORITY_STYLES.low}`}>
                                                        {req.priority}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selected
                                            ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" />
                                            : <Clock className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-1" />
                                        }
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Assign button (center) */}
                <div className="flex flex-col items-center justify-center gap-3 py-8 lg:py-0 lg:pt-16">
                    <button
                        onClick={handleAssign}
                        disabled={!canAssign || assigning}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[11px] tracking-widest transition-all shadow-md
                            ${canAssign
                                ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                                : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                            }`}
                    >
                        {assigning ? (
                            <span className="animate-pulse">ASSIGNING…</span>
                        ) : (
                            <>
                                ASSIGN
                                <ChevronRight className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                    {!canAssign && (
                        <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest text-center max-w-[80px]">
                            {!selectedRequest && !selectedStaff ? "Pick both" : !selectedRequest ? "Pick request" : "Pick staff"}
                        </p>
                    )}
                </div>

                {/* Staff list */}
                <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Available Staff</span>
                        <span className="ml-auto text-[10px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {staff.length}
                        </span>
                    </div>
                    <div className="divide-y max-h-[420px] overflow-y-auto">
                        {staff.length === 0 && (
                            <div className="p-10 text-center text-muted-foreground/40 text-xs font-bold uppercase tracking-widest">
                                No staff found
                            </div>
                        )}
                        {staff.map((s: any) => {
                            const selected = selectedStaff === s._id
                            const busy = !!s.currentTaskId
                            return (
                                <button
                                    key={s._id}
                                    onClick={() => setSelectedStaff(selected ? null : s._id)}
                                    className={`w-full text-left px-5 py-4 transition-colors border-l-2 ${selected
                                        ? "bg-primary/10 border-primary"
                                        : "hover:bg-muted/40 border-transparent"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                                            {s.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{s.name}</p>
                                            <p className="text-[10px] text-muted-foreground capitalize">
                                                {s.department ?? "General"}
                                            </p>
                                        </div>
                                        {busy
                                            ? <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-400 border-amber-500/20 shrink-0">Busy</span>
                                            : selected
                                                ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                                : <AlertCircle className="w-4 h-4 text-emerald-400/40 shrink-0" />
                                        }
                                    </div>
                                    {s.assignedDuties?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2 pl-11">
                                            {s.assignedDuties.map((d: string) => (
                                                <span key={d} className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-md border capitalize">
                                                    {d.replace("_", " ")}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Assignments table */}
            <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">All Assignments</span>
                    <span className="ml-auto text-[10px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {assignments.length}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 border-b text-muted-foreground uppercase text-[10px] tracking-widest font-black">
                            <tr>
                                <th className="p-5">Staff Member</th>
                                <th className="p-5">Room / Area</th>
                                <th className="p-5">Service</th>
                                <th className="p-5 text-center">Satisfaction</th>
                                <th className="p-5">Status</th>
                                <th className="p-5">Assigned</th>
                                <th className="p-5 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {assignments.map((a: any) => (
                                <tr key={a._id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                                {a.staffName?.charAt(0)}
                                            </div>
                                            <span className="font-bold text-sm">{a.staffName}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="text-sm font-mono font-bold bg-muted px-2 py-1 rounded-lg border">
                                            {a.roomNumber}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center space-x-2 text-xs font-bold text-muted-foreground">
                                            <div className="p-1.5 bg-muted rounded-lg text-foreground">
                                                <ServiceIcon type={a.serviceType} />
                                            </div>
                                            <span className="capitalize">{a.serviceType?.replace("_", " ")}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        {a.rating ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex text-amber-500">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={i < a.rating ? "text-amber-500" : "text-muted opacity-20"}>★</span>
                                                    ))}
                                                </div>
                                                {a.feedback && (
                                                    <span className="text-[9px] text-muted-foreground italic max-w-[120px] truncate" title={a.feedback}>
                                                        "{a.feedback}"
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">—</span>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <div className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase border transition-all inline-block ${STATUS_STYLES[a.status] ?? STATUS_STYLES.pending}`}>
                                            {a.status?.replace("_", " ")}
                                        </div>
                                    </td>
                                    <td className="p-5 text-[11px] text-muted-foreground font-bold italic">
                                        {new Date(a.assignedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </td>
                                    <td className="p-5 text-right">
                                        <button
                                            onClick={() => removeMutation({ id: a._id })}
                                            className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {assignments.length === 0 && (
                    <div className="p-24 text-center bg-muted/20 border-t border-dashed">
                        <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase italic">No active assignments</p>
                    </div>
                )}
            </div>
        </div>
    )
}