"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Trash2, ClipboardList, Bed, Wrench, Eraser } from "lucide-react"

export default function HousekeepingPage() {
    const assignments = useQuery(api.housekeeping.list) ?? []
    const users = useQuery(api.users.listAll) ?? []
    const housekeepers = users.filter((u: any) => u.role === "housekeeper" || u.role === "admin")

    const assignMutation = useMutation(api.housekeeping.assign)
    const updateStatusMutation = useMutation(api.housekeeping.updateStatus)
    const removeMutation = useMutation(api.housekeeping.remove)

    const [housekeeperId, setHousekeeperId] = useState("")
    const [roomNumber, setRoomNumber] = useState("")
    const [serviceType, setServiceType] = useState("Cleaning")

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!housekeeperId || !roomNumber.trim()) return

        await assignMutation({
            housekeeperId: housekeeperId as any,
            roomNumber: roomNumber.trim(),
            serviceType,
        })

        setHousekeeperId("")
        setRoomNumber("")
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
            case "in_progress": return "bg-amber-500/20 text-amber-400 border-amber-500/20"
            default: return "bg-white/5 text-blue-200/60 border-white/10"
        }
    }

    const getServiceIcon = (type: string) => {
        switch (type) {
            case "Maintenance": return <Wrench className="w-4 h-4" />
            case "Laundry": return <Eraser className="w-4 h-4" />
            default: return <Bed className="w-4 h-4" />
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center space-x-3 mb-2">
                <ClipboardList className="w-8 h-8 text-purple-400" />
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
                    Housekeeping Assignments
                </h2>
            </div>

            <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-100 italic">Assign Staff to Room</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm text-blue-200/60 ml-1">Staff Member</label>
                        <select
                            className="glass-input w-full bg-indigo-950/40"
                            value={housekeeperId}
                            onChange={(e) => setHousekeeperId(e.target.value)}
                        >
                            <option value="">Select Staff...</option>
                            {housekeepers.map((u: any) => (
                                <option key={u._id} value={u._id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-blue-200/60 ml-1">Room / Area</label>
                        <input
                            className="glass-input w-full"
                            placeholder="Room 101, Poolside..."
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-blue-200/60 ml-1">Service Required</label>
                        <select
                            className="glass-input w-full bg-indigo-950/40"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                        >
                            <option value="Cleaning">Cleaning</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Laundry">Laundry</option>
                            <option value="Restock">Restock</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="glass-button bg-indigo-600/50 hover:bg-indigo-600/70 text-white h-[42px]"
                    >
                        Create Assignment
                    </button>
                </form>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-blue-200/80 uppercase text-[10px] tracking-widest font-bold">
                            <tr>
                                <th className="p-4">Staff Member</th>
                                <th className="p-4">Room / Area</th>
                                <th className="p-4">Service</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Assigned At</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {assignments.map((a: any) => (
                                <tr key={a._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-medium text-blue-50">
                                        {a.housekeeperName}
                                    </td>
                                    <td className="p-4 text-blue-200/80 font-mono">
                                        {a.roomNumber}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-2 text-sm text-blue-200/60">
                                            {getServiceIcon(a.serviceType)}
                                            <span>{a.serviceType}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <select
                                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border transition-colors cursor-pointer outline-none ${getStatusStyle(a.status)}`}
                                            value={a.status}
                                            onChange={(e) => updateStatusMutation({ id: a._id, status: e.target.value })}
                                        >
                                            <option value="pending" className="bg-slate-900 border-none">Pending</option>
                                            <option value="in_progress" className="bg-slate-900 border-none">In Progress</option>
                                            <option value="completed" className="bg-slate-900 border-none">Completed</option>
                                        </select>
                                    </td>
                                    <td className="p-4 text-xs text-white/30 font-mono italic">
                                        {new Date(a.assignedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => removeMutation({ id: a._id })}
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
                {assignments.length === 0 && (
                    <div className="p-12 text-center text-white/10 italic">
                        No active housekeeping assignments.
                    </div>
                )}
            </div>
        </div>
    )
}
