"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Trash2, ClipboardList, Bed, Wrench, Eraser, Upload } from "lucide-react"

export default function TasksPage() {
    const assignments = useQuery(api.tasks.list) ?? []
    const users = useQuery(api.users.listAll) ?? []
    const campers = users.filter((u: any) => u.role === "camper")

    const createRequest = useMutation(api.requests.create)
    const updateStatusMutation = useMutation(api.tasks.updateStatus)
    const removeMutation = useMutation(api.tasks.remove)
    const generateUploadUrl = useMutation(api.images.generateUploadUrl)

    const [camperId, setCamperId] = useState("")
    const [roomNumber, setRoomNumber] = useState("")
    const [serviceType, setServiceType] = useState("housekeeping")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState("low")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!camperId || !roomNumber.trim()) return

        let imageStorageId: string | undefined = undefined
        if (selectedFile) {
            const postUrl = await generateUploadUrl()
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": selectedFile.type },
                body: selectedFile,
            })
            const { storageId } = await result.json()
            imageStorageId = storageId
        }

        await createRequest({
            userId: camperId as any,
            type: serviceType,
            roomNumber: roomNumber.trim(),
            description: description || "Admin-created request",
            priority,
            image: imageStorageId,
        })

        setCamperId("")
        setRoomNumber("")
        setDescription("")
        setPriority("low")
        setSelectedFile(null)
        setPreviewUrl(null)
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "rated": return "bg-primary/20 text-primary border-primary/20"
            case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
            case "confirmed": return "bg-blue-500/20 text-blue-400 border-blue-500/20"
            case "in_progress": return "bg-amber-500/20 text-amber-400 border-amber-500/20"
            default: return "bg-white/5 text-blue-200/60 border-white/10"
        }
    }

    const getServiceIcon = (type: string) => {
        const t = type.toLowerCase()
        if (t.includes("maint")) return <Wrench className="w-4 h-4" />
        if (t.includes("laundry")) return <Eraser className="w-4 h-4" />
        return <Bed className="w-4 h-4" />
    }

    return (
        <div className="space-y-8 md:space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage room assignments and staff schedules</p>
                    </div>
                </div>
            </div>

            <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <h3 className="text-xl font-bold">Assign Staff to Room</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Camper</label>
                        <select
                            className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                            value={camperId}
                            onChange={(e) => setCamperId(e.target.value)}
                            required
                        >
                            <option value="">Select Camper...</option>
                            {campers.map((u: any) => (
                                <option key={u._id} value={u._id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Room / Area</label>
                        <input
                            className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                            placeholder="e.g. Room 101"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Type</label>
                        <select
                            className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                        >
                            <option value="housekeeping">Housekeeping</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="laundry">Laundry</option>
                            <option value="room_service">Room Service</option>
                                <option value="delivery">Delivery</option>
                            </select>
                        </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Priority</label>
                        <select
                            className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="low">Low</option>
                            <option value="important">Important</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Image (optional)</label>
                        <div className="flex items-center gap-3">
                            <label className="flex h-11 px-4 cursor-pointer items-center justify-center rounded-xl border border-dashed border-input bg-muted/40 text-[11px] text-muted-foreground hover:border-primary/60 transition-colors">
                                <Upload className="h-4 w-4 mr-2" />
                                <span>{previewUrl ? "Change" : "Upload"}</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null
                                        setSelectedFile(file)
                                        setPreviewUrl(file ? URL.createObjectURL(file) : null)
                                    }}
                                />
                            </label>
                            {previewUrl && (
                                <div className="relative h-11 w-16 rounded-lg overflow-hidden border bg-muted/50">
                                    <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        className="absolute -top-2 -right-2 text-[10px] bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full"
                                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                <button
                    type="submit"
                    className="bg-primary text-primary-foreground h-11 px-6 rounded-xl font-black text-[11px] tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95"
                >
                    CREATE ASSIGNMENT
                </button>
                </form>
            </div>

            <div className="bg-card border rounded-3xl p-4 md:p-6 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">How this works</p>
                <p>- Admin form now creates a Request (with image, priority, description) and an associated Task.</p>
                <p>- Staff assignment is automatic based on duty/vacancy (same as client flow).</p>
            </div>

            <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
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
                                            {getServiceIcon(a.serviceType)}
                                        </div>
                                        <span>{a.serviceType}</span>
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
                                        <span className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">No Rating</span>
                                    )}
                                </td>
                                    <td className="p-5 text-center">
                                        <div className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase border transition-all inline-block ${getStatusStyle(a.status)}`}>
                                            {a.status.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="p-5 text-[11px] text-muted-foreground font-bold italic">
                                        {new Date(a.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
