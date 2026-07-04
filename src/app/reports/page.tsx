"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "@convex/_generated/api"
import { MessageSquare, AlertTriangle, CheckCircle, Info, Filter, Search } from "lucide-react"

export default function ReportsPage() {
    const [filterStatus, setFilterStatus] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    const reports = useQuery(api.reports.list, { status: filterStatus }) ?? []

    const resolveMutation = useMutation(api.reports.markAsResolved)

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "bug": return <AlertTriangle className="w-4 h-4 text-red-400" />
            case "feedback": return <Info className="w-4 h-4 text-blue-400" />
            case "incident": return <CheckCircle className="w-4 h-4 text-amber-400" />
            default: return <MessageSquare className="w-4 h-4 text-indigo-400" />
        }
    }

    const filteredReports = reports.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 md:space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Reports</h1>
                        <p className="text-sm text-muted-foreground mt-1">Review and resolve visitor feedback and technical issues</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="relative group flex-1 sm:flex-initial">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search feedback..."
                            className="w-full sm:w-64 h-11 pl-11 pr-4 rounded-xl border bg-muted/50 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold placeholder:text-muted-foreground/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center bg-card border rounded-xl px-4 h-11 shadow-sm">
                        <Filter className="w-4 h-4 text-muted-foreground mr-2.5" />
                        <select
                            className="bg-transparent text-[11px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Everywhere</option>
                            <option value="unread">New Reports</option>
                            <option value="resolved">Archived</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                    {filteredReports.map((r: any) => (
                        <div
                            key={r._id}
                            className={`bg-card border rounded-3xl p-6 lg:p-8 flex flex-col group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${r.status === 'resolved' ? 'opacity-50 grayscale' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center space-x-2.5">
                                    <div className="p-2 bg-muted rounded-xl border">
                                        {getTypeIcon(r.type)}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                        {r.type}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground/50 font-mono font-bold">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h4 className="text-xl font-black text-foreground mb-3 leading-tight uppercase tracking-tight">{r.title}</h4>
                            <p className="text-sm text-foreground/70 flex-grow mb-8 leading-relaxed font-medium line-clamp-4">
                                {r.message}
                            </p>

                            <div className="flex justify-between items-center pt-6 border-t mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1 leading-none">Reporter</span>
                                    <span className="text-sm font-bold text-foreground">{r.userName}</span>
                                </div>

                                {r.status === 'unread' ? (
                                    <button
                                        onClick={() => resolveMutation({ id: r._id })}
                                        className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95"
                                    >
                                        RESOLVE
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-2 text-primary text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Closed</span>
                                    </div>
                                )}
                            </div>

                            <div className={`absolute bottom-0 left-0 right-0 h-1.5 transition-colors ${r.status === 'resolved' ? 'bg-primary/20' :
                                    r.type === 'bug' ? 'bg-destructive' :
                                        r.type === 'incident' ? 'bg-foreground' :
                                            'bg-muted-foreground'
                                }`} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-32 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                    <div className="inline-flex p-6 rounded-3xl bg-muted mb-6">
                        <MessageSquare className="w-12 h-12 opacity-10" />
                    </div>
                    <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase italic">Communication channel clear</p>
                </div>
            )}
        </div>
    )
}
