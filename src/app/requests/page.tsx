"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import {
    Clock,
    CheckCircle2,
    PlayCircle,
    Wrench,
    Brush,
    Shirt,
    Truck,
    Trash2,
    Eye,
    Bell
} from "lucide-react"

export default function RequestsPage() {
    const requests = useQuery(api.requests.list, {}) ?? []
    const updateStatus = useMutation(api.requests.updateStatus)
    const removeRequest = useMutation(api.requests.remove)

    const getIcon = (type: string) => {
        switch (type) {
            case "maintenance": return <Wrench className="h-4 w-4" />
            case "housekeeping": return <Brush className="h-4 w-4" />
            case "laundry": return <Shirt className="h-4 w-4" />
            case "delivery": return <Truck className="h-4 w-4" />
            default: return <Bell className="h-4 w-4" />
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "pending": return "bg-blue-500/20 text-blue-400 border-blue-500/20"
            case "in_progress": return "bg-amber-500/20 text-amber-400 border-amber-500/20"
            case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
            default: return "bg-white/5 text-blue-200/60 border-white/10"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                    <Bell className="w-8 h-8 text-indigo-400" />
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
                            Service Requests
                        </h2>
                        <p className="text-sm text-blue-200/40 italic">Manage all visitor requests across the camp.</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <div className="glass-card px-4 py-2 flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-semibold text-blue-200/80">
                            {requests.filter(r => r.status === "pending").length} Pending
                        </span>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-blue-200/80 uppercase text-[10px] tracking-widest font-bold">
                            <tr>
                                <th className="p-4 border-b border-white/10">Visitor</th>
                                <th className="p-4 border-b border-white/10">Type</th>
                                <th className="p-4 border-b border-white/10">Room</th>
                                <th className="p-4 border-b border-white/10">Description</th>
                                <th className="p-4 border-b border-white/10">Status</th>
                                <th className="p-4 border-b border-white/10">Submitted</th>
                                <th className="p-4 border-b border-white/10 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {requests.map((req: any) => (
                                <tr key={req._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-medium text-blue-50 whitespace-nowrap">
                                        {req.userName}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2 text-xs text-blue-200/60 capitalize">
                                            <div className="p-1.5 rounded-lg bg-white/5">
                                                {getIcon(req.type)}
                                            </div>
                                            <span>{req.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-blue-200/80 font-mono text-xs">
                                        {req.roomNumber}
                                    </td>
                                    <td className="p-4">
                                        <div className="max-w-xs space-y-1">
                                            <p className="text-xs text-blue-100/80 truncate font-medium">
                                                {req.description}
                                            </p>
                                            {req.imageUrl && (
                                                <a
                                                    href={req.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center space-x-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
                                                >
                                                    <Eye size={10} />
                                                    <span>View Attachment</span>
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <select
                                            className={`text-[10px] px-2 py-1 rounded font-bold uppercase border transition-colors cursor-pointer outline-none ${getStatusStyle(req.status)}`}
                                            value={req.status}
                                            onChange={(e) => updateStatus({ id: req._id, status: e.target.value })}
                                        >
                                            <option value="pending" className="bg-slate-900 border-none">Pending</option>
                                            <option value="in_progress" className="bg-slate-900 border-none">In Progress</option>
                                            <option value="completed" className="bg-slate-900 border-none">Completed</option>
                                        </select>
                                    </td>
                                    <td className="p-4 text-xs text-white/30 font-mono italic whitespace-nowrap">
                                        {new Date(req.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this request?")) {
                                                    removeRequest({ id: req._id })
                                                }
                                            }}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 group-hover:opacity-100 opacity-0 transition-all transform hover:scale-110"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {requests.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                            <Bell className="w-8 h-8 text-blue-200/20" />
                        </div>
                        <h3 className="text-lg font-medium text-blue-200/40 italic">No service requests found.</h3>
                        <p className="text-sm text-blue-200/20">When visitors submit requests, they will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
