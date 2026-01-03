"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
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
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <MessageSquare className="w-8 h-8 text-emerald-400" />
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
                        User Reports
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            className="glass-input pl-10 w-64 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center glass-card px-3 py-1.5 space-x-2">
                        <Filter className="w-4 h-4 text-white/20" />
                        <select
                            className="bg-transparent text-xs text-white/60 outline-none cursor-pointer"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all" className="bg-slate-900">All Status</option>
                            <option value="unread" className="bg-slate-900">Unread</option>
                            <option value="resolved" className="bg-slate-900">Resolved</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map((r: any) => (
                        <div key={r._id} className={`glass-card p-6 flex flex-col group relative overflow-hidden transition-all hover:translate-y-[-4px] ${r.status === 'resolved' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-2">
                                    {getTypeIcon(r.type)}
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200/60 font-mono italic">
                                        {r.type}
                                    </span>
                                </div>
                                <span className="text-[10px] text-white/30 font-mono">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h4 className="text-lg font-bold text-blue-50 mb-2 truncate">{r.title}</h4>
                            <p className="text-sm text-blue-200/60 flex-grow mb-6 leading-relaxed italic line-clamp-4">
                                "{r.message}"
                            </p>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-white/20 uppercase font-bold tracking-tighter">Reported By</span>
                                    <span className="text-xs font-medium text-blue-200/80">{r.userName}</span>
                                </div>

                                {r.status === 'unread' ? (
                                    <button
                                        onClick={() => resolveMutation({ id: r._id })}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all transform hover:scale-105"
                                    >
                                        Mark Resolved
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-1 text-emerald-400/60 text-[10px] font-bold uppercase">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Resolved</span>
                                    </div>
                                )}
                            </div>

                            <div className={`absolute bottom-0 left-0 right-0 h-1 ${r.type === 'bug' ? 'bg-red-500/30' :
                                r.type === 'incident' ? 'bg-amber-500/30' :
                                    'bg-blue-500/30'
                                } ${r.status === 'resolved' ? 'bg-emerald-500/30' : ''}`} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-20 text-center glass-card border-dashed border-white/5">
                    <MessageSquare className="w-16 h-16 text-white/5 mx-auto mb-4" />
                    <p className="text-white/20 italic">No reports found matching your criteria.</p>
                </div>
            )}


        </div>
    )
}
