"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"
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
    Bell,
    AlertCircle,
    MoreHorizontal,
    ClipboardCheck,
    Calendar,
    User,
    ChevronRight,
    Loader2,
    Plus
} from "lucide-react"
import { CreateRequestDialog } from "@/components/create-request-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function RequestsPage() {
    const router = useRouter()
    const requests = useQuery(api.requests.list, {})
    const requestList = requests ?? []
    const staffList = useQuery(api.users.listStaff, {})
    const updateStatus = useMutation(api.requests.updateStatus)
    const updateOfficeUse = useMutation(api.requests.updateOfficeUse)
    const removeRequest = useMutation(api.requests.remove)
    const assignStaffToRequest = useMutation(api.tasks.assignStaffToRequest)

    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [serviceFilter, setServiceFilter] = useState("all")

    // Office Use Form State
    const [urgency, setUrgency] = useState("")
    const [tradesperson, setTradesperson] = useState("")
    const [workOrderSent, setWorkOrderSent] = useState("")
    const [isSavingOffice, setIsSavingOffice] = useState(false)

    // Staff picker + guest profile popup state
    const [staffSearch, setStaffSearch] = useState("")
    const [staffPickerOpen, setStaffPickerOpen] = useState(false)
    const [selectedStaffId, setSelectedStaffId] = useState<any>(null)
    const [isProfileOpen, setIsProfileOpen] = useState(false)

    const guestProfile = useQuery(
        api.users.getProfile,
        selectedRequest?.userId ? { id: selectedRequest.userId } : "skip"
    )

    // The task behind this request: assigned staff, stages, updates, feedback
    const requestTask = useQuery(
        api.tasks.getByRequest,
        selectedRequest?._id ? { requestId: selectedRequest._id } : "skip"
    )

    const filteredStaff = useMemo(() => {
        const q = staffSearch.trim().toLowerCase()
        const all = staffList || []
        const matches = q
            ? all.filter((s: any) =>
                s.name?.toLowerCase().includes(q) ||
                s.department?.toLowerCase().includes(q) ||
                (s.assignedDuties || []).some((d: string) => d.toLowerCase().includes(q)))
            : all
        // Available staff first, then alphabetical
        return [...matches].sort((a: any, b: any) => {
            if (a.available !== b.available) return a.available ? -1 : 1
            return (a.name || "").localeCompare(b.name || "")
        })
    }, [staffList, staffSearch])

    const openRequest = (req: any) => {
        setSelectedRequest(req)
        setUrgency(req.officeUse?.urgency || req.priority || "routine")
        setTradesperson(req.officeUse?.tradesperson || "")
        setWorkOrderSent(req.officeUse?.workOrderSent || "")
        setStaffSearch("")
        setStaffPickerOpen(false)
        setSelectedStaffId(null)
        setIsDetailsOpen(true)
    }

    const handleSaveOfficeUse = async () => {
        if (!selectedRequest) return
        setIsSavingOffice(true)
        try {
            await updateOfficeUse({
                id: selectedRequest._id,
                urgency,
                tradesperson,
                workOrderSent,
            })
            // Assign the chosen staff member if the task has nobody on it yet
            if (selectedStaffId && !requestTask?.staffId) {
                await assignStaffToRequest({
                    requestId: selectedRequest._id,
                    staffId: selectedStaffId,
                })
            }
            setIsDetailsOpen(false)
            toast.success("Request updated", {
                description: selectedStaffId && !requestTask?.staffId
                    ? `Assigned to ${tradesperson}. They have been notified.`
                    : "Office use fields saved.",
            })
        } catch (error) {
            console.error(error)
            toast.error("Update failed", { description: "Could not save the changes." })
        } finally {
            setIsSavingOffice(false)
        }
    }

    const getIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "maintenance": return <Wrench className="h-4 w-4" />
            case "housekeeping": return <Brush className="h-4 w-4" />
            case "laundry": return <Shirt className="h-4 w-4" />
            case "delivery": return <Truck className="h-4 w-4" />
            case "room_service": return <ShoppingCart className="h-4 w-4" />
            default: return <Bell className="h-4 w-4" />
        }
    }

    const ShoppingCart = ({ className }: { className?: string }) => <Truck className={className} /> // Just a placeholder

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "pending": return "bg-blue-500/20 text-blue-400 border-blue-500/20"
            case "in_progress": return "bg-amber-500/20 text-amber-400 border-amber-500/20"
            case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
            case "rejected": return "bg-destructive/20 text-destructive border-destructive/20"
            default: return "bg-white/5 text-blue-200/60 border-white/10"
        }
    }

    const filteredRequests = requestList
        .filter((r: any) => {
            const matchesService = serviceFilter === "all" ? true : r.type === serviceFilter
            const query = search.trim().toLowerCase()
            const matchesSearch = query.length === 0
                || r.roomNumber?.toLowerCase().includes(query)
                || r.description?.toLowerCase().includes(query)
                || r.userName?.toLowerCase().includes(query)
            return matchesService && matchesSearch
        })
        .sort((a: any, b: any) => b.createdAt - a.createdAt)

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Service Requests</h1>
                        <p className="text-sm text-muted-foreground font-medium">Monitoring guest needs and facility maintenance.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-3 bg-card border-2 rounded-2xl px-5 py-2.5 shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
                            {requests === undefined ? (
                                <Skeleton className="h-3 w-4 inline-block align-middle mr-1" />
                            ) : (
                                requestList.filter((r: any) => r.status === "pending").length
                            )} ACTIVE TASKS
                        </span>
                    </div>
                    <Button
                        onClick={() => setIsNewRequestOpen(true)}
                        className="h-10 rounded-2xl font-black uppercase tracking-widest text-[10px] px-4 gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Request
                    </Button>
                </div>
            </div>

            <div className="bg-card border-2 rounded-[2.5rem] overflow-hidden shadow-xl shadow-black/5">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between px-6 pt-6">
                    <div className="flex gap-3 w-full md:w-auto">
                        <Input
                            placeholder="Search by room, guest, description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-11 rounded-xl md:w-80"
                        />
                        <Select value={serviceFilter} onValueChange={setServiceFilter}>
                            <SelectTrigger className="h-11 w-44 rounded-xl">
                                <SelectValue placeholder="All services" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All services</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="housekeeping">Housekeeping</SelectItem>
                                <SelectItem value="laundry">Laundry</SelectItem>
                                <SelectItem value="room_service">Room Service</SelectItem>
                                <SelectItem value="delivery">Delivery</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Showing {filteredRequests.length} of {requestList.length}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/30 border-b-2 text-muted-foreground uppercase text-[10px] tracking-[0.2em] font-black">
                            <tr>
                                <th className="p-6">Visitor / Guest</th>
                                <th className="p-6">Type & Category</th>
                                <th className="p-6">Location</th>
                                <th className="p-6">Request Info</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2">
                            {requests === undefined ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <Skeleton className="w-10 h-10 rounded-xl" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 space-y-2">
                                            <Skeleton className="h-3 w-20" />
                                            <Skeleton className="h-4 w-24 rounded-lg" />
                                        </td>
                                        <td className="p-6">
                                            <Skeleton className="h-8 w-16 rounded-xl" />
                                        </td>
                                        <td className="p-6 space-y-2">
                                            <Skeleton className="h-3 w-48" />
                                            <Skeleton className="h-3 w-32" />
                                        </td>
                                        <td className="p-6">
                                            <Skeleton className="h-9 w-32 rounded-xl" />
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-end gap-2">
                                                <Skeleton className="h-8 w-8 rounded-xl" />
                                                <Skeleton className="h-8 w-8 rounded-xl" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredRequests.map((req: any) => (
                                <tr key={req._id} className="hover:bg-muted/20 transition-all group cursor-pointer" onClick={() => openRequest(req)}>
                                    <td className="p-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/5 flex items-center justify-center font-black text-xs text-primary">
                                                {req.userName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{req.userName}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold italic">{new Date(req.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-primary/80">
                                                {getIcon(req.type)}
                                                <span>{req.type.replace("_", " ")}</span>
                                            </div>
                                            {req.category && (
                                                <Badge variant="outline" className="text-[9px] font-black border-primary/20 bg-primary/5 rounded-lg px-2">
                                                    {req.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-xs font-black bg-muted border-2 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                                            {req.roomNumber}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="max-w-xs">
                                            <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed font-bold italic">
                                                {req.description}
                                            </p>
                                            {req.laundryItems && (
                                                <p className="text-[10px] text-primary font-black uppercase mt-1">
                                                    {req.laundryItems.length} items • {req.starch}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6" onClick={(e) => e.stopPropagation()}>
                                        <Select 
                                            value={req.status} 
                                            onValueChange={(val: string) => {
                                                updateStatus({ id: req._id, status: val })
                                                    .then(() => toast.success("Status updated", { description: `Marked as ${val.replace("_", " ")}.` }))
                                                    .catch(() => toast.error("Update failed"))
                                            }}
                                        >
                                            <SelectTrigger className={`h-9 w-32 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${getStatusStyle(req.status)}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-2">
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                className="rounded-xl hover:bg-muted p-2"
                                                onClick={(e) => { e.stopPropagation(); openRequest(req); }}
                                            >
                                                <Eye className="w-4 h-4 text-primary" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                className="rounded-xl hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Delete this request record?")) {
                                                        removeRequest({ id: req._id })
                                                            .then(() => toast.success("Request deleted"))
                                                            .catch(() => toast.error("Delete failed"))
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>

                {requests !== undefined && requestList.length === 0 && (
                    <div className="p-24 text-center bg-muted/10 border-t-2 border-dashed">
                        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs italic">No active requests found</p>
                    </div>
                )}
            </div>

            <CreateRequestDialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen} />

            {/* Request Details & Office Use Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-4 overflow-hidden p-0">
                    {selectedRequest && (
                        <div className="flex flex-col h-[85vh] md:h-auto overflow-y-auto">
                            <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    {getIcon(selectedRequest.type)}
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-[.3em] opacity-80">{selectedRequest.type.replace("_", " ")}</p>
                                        {selectedRequest.category && (
                                            <>
                                                <div className="w-1 h-1 rounded-full bg-white opacity-40" />
                                                <p className="text-[10px] font-black uppercase tracking-[.3em]">{selectedRequest.category}</p>
                                            </>
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter italic uppercase">{selectedRequest.roomNumber} Request</h2>
                                    <p className="text-sm font-medium opacity-90 mt-1">Submitted by {selectedRequest.userName} at {new Date(selectedRequest.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <section className="space-y-3">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <div className="w-1 h-3 bg-primary rounded-full" />
                                            Guest Information
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsProfileOpen(true)}
                                                className="p-3 bg-muted/40 rounded-2xl border flex items-center gap-3 text-left w-full hover:border-primary/50 hover:bg-muted/60 transition-colors group/guest"
                                            >
                                                <div className="w-11 h-11 rounded-xl border-2 bg-background overflow-hidden flex items-center justify-center text-primary font-black shrink-0">
                                                    {guestProfile?.imageUrl ? (
                                                        <img src={guestProfile.imageUrl} alt={guestProfile.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (guestProfile?.name || selectedRequest.userName || "?").charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Requested By</p>
                                                    <p className="text-sm font-bold truncate">{guestProfile?.name || selectedRequest.userName}</p>
                                                    {guestProfile?.roomNumber && (
                                                        <p className="text-[10px] text-muted-foreground font-bold">Room {guestProfile.roomNumber}</p>
                                                    )}
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/guest:text-primary transition-colors shrink-0" />
                                            </button>
                                            {selectedRequest.accessPreference && (
                                                <div className="p-3 bg-muted/40 rounded-2xl border flex items-center gap-3">
                                                    <div className="p-2 bg-background rounded-lg border text-primary"><CheckCircle2 size={14} /></div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Access Preference</p>
                                                        <p className="text-xs font-bold uppercase">{selectedRequest.accessPreference.replace("_", " ")}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="space-y-3">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <div className="w-1 h-3 bg-primary rounded-full" />
                                            Request Details
                                        </h3>
                                        <div className="p-4 bg-muted/40 rounded-2xl border-2 space-y-3">
                                            {selectedRequest.subCategory && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className="rounded-lg font-black text-[9px] uppercase">{selectedRequest.category}</Badge>
                                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                    <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase border-primary/20 text-primary">{selectedRequest.subCategory}</Badge>
                                                </div>
                                            )}
                                            {selectedRequest.applianceModel && (
                                                <p className="text-[10px] font-black text-primary uppercase">Appliance: <span className="text-foreground italic">{selectedRequest.applianceModel}</span></p>
                                            )}
                                            <p className="text-xs font-medium leading-relaxed italic text-foreground/80">"{selectedRequest.description}"</p>
                                            
                                            {selectedRequest.laundryItems && (
                                                <div className="mt-4 pt-4 border-t-2 space-y-2">
                                                    <p className="text-[11px] font-black uppercase tracking-widest text-primary">Itemized Checklist:</p>
                                                    <div className="grid grid-cols-1 gap-1">
                                                        {selectedRequest.laundryItems.map((item: any, i: number) => (
                                                            <div key={i} className="flex justify-between items-center text-[10px] font-bold p-2 bg-background rounded-lg border">
                                                                <span>{item.name}</span>
                                                                <span className="text-primary">x{item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-black bg-primary/5 p-2 rounded-lg border border-primary/10">
                                                        <span className="text-muted-foreground uppercase">Starch:</span>
                                                        <span className="text-primary uppercase tracking-wider">{selectedRequest.starch}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedRequest.imageUrl && (
                                                <div className="mt-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Attached Image:</p>
                                                    <img src={selectedRequest.imageUrl} className="rounded-xl border-2 w-full object-cover aspect-video cursor-zoom-in group-hover:scale-[1.02] transition-transform" onClick={() => window.open(selectedRequest.imageUrl)} />
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    <section className="space-y-4 p-6 bg-primary/5 rounded-[2rem] border-2 border-primary/10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <ClipboardCheck size={80} className="text-primary" />
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-primary rounded-full shadow-[0_0_10px_oklch(0.696_0.17_162.48)]" />
                                            OFFICE USE ONLY
                                        </h3>
                                        
                                        <div className="space-y-4 relative z-10">
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Urgency Rating</p>
                                                <Select value={urgency} onValueChange={setUrgency}>
                                                    <SelectTrigger className="h-11 rounded-xl border-2 bg-background font-bold text-xs uppercase tracking-tight">
                                                        <SelectValue placeholder="Select urgency" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-2">
                                                        <SelectItem value="emergency" className="text-destructive font-black">EMERGENCY (SLA: 4h)</SelectItem>
                                                        <SelectItem value="urgent" className="text-amber-500 font-black">URGENT (SLA: 24h)</SelectItem>
                                                        <SelectItem value="routine" className="font-black">ROUTINE (SLA: 5d)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {requestTask?.staff ? (
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Staff Working On This</p>
                                                    <div className="p-3 bg-background rounded-2xl border-2 flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-xl border-2 bg-muted overflow-hidden flex items-center justify-center text-primary font-black shrink-0">
                                                            {requestTask.staff.imageUrl ? (
                                                                <img src={requestTask.staff.imageUrl} alt={requestTask.staff.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                requestTask.staff.name?.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate">{requestTask.staff.name}</p>
                                                            <p className="text-[9px] text-muted-foreground font-bold uppercase truncate">
                                                                {(requestTask.staff.assignedDuties || []).map((d: string) => d.replace("_", " ")).join(", ") || requestTask.staff.department?.replace("_", " ") || "Staff"}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${requestTask.staff.isOnSite ? "text-emerald-500" : "text-muted-foreground/50"}`}>
                                                            {requestTask.staff.isOnSite ? "● On site" : "○ Off site"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Staff</p>
                                                    <div className="relative">
                                                        <Input
                                                            placeholder={tradesperson || "Search staff by name or duty..."}
                                                            value={staffPickerOpen ? staffSearch : tradesperson}
                                                            onChange={(e) => {
                                                                setStaffSearch(e.target.value)
                                                                setStaffPickerOpen(true)
                                                            }}
                                                            onFocus={() => {
                                                                setStaffSearch("")
                                                                setStaffPickerOpen(true)
                                                            }}
                                                            className="h-11 rounded-xl border-2 bg-background font-bold text-xs pl-10"
                                                        />
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                                                        {staffPickerOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setStaffPickerOpen(false)} />
                                                                <div className="absolute left-0 right-0 top-12 z-50 bg-background border-2 rounded-2xl shadow-2xl overflow-hidden">
                                                                    <div className="max-h-56 overflow-y-auto divide-y">
                                                                        {staffList === undefined ? (
                                                                            <div className="p-4 text-center">
                                                                                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                                                            </div>
                                                                        ) : filteredStaff.length === 0 ? (
                                                                            <p className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                                                No staff found
                                                                            </p>
                                                                        ) : (
                                                                            filteredStaff.map((staff: any) => (
                                                                                <button
                                                                                    key={staff._id}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setTradesperson(staff.name)
                                                                                        setSelectedStaffId(staff._id)
                                                                                        setStaffPickerOpen(false)
                                                                                        setStaffSearch("")
                                                                                    }}
                                                                                    className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors ${tradesperson === staff.name ? "bg-primary/5" : ""}`}
                                                                                >
                                                                                    <div className="w-8 h-8 rounded-lg border bg-muted overflow-hidden flex items-center justify-center text-primary text-xs font-black shrink-0">
                                                                                        {staff.imageUrl ? (
                                                                                            <img src={staff.imageUrl} alt={staff.name} className="w-full h-full object-cover" />
                                                                                        ) : (
                                                                                            staff.name?.charAt(0).toUpperCase()
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-xs font-bold truncate">{staff.name}</p>
                                                                                        <p className="text-[9px] text-muted-foreground font-bold uppercase truncate">
                                                                                            {(staff.assignedDuties || []).map((d: string) => d.replace("_", " ")).join(", ") || staff.department?.replace("_", " ") || "Staff"}
                                                                                        </p>
                                                                                    </div>
                                                                                    <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest shrink-0 ${staff.available ? "text-emerald-500" : "text-amber-500"}`}>
                                                                                        <span className={`w-1.5 h-1.5 rounded-full ${staff.available ? "bg-emerald-500" : "bg-amber-500"}`} />
                                                                                        {staff.available ? "Available" : "Busy"}
                                                                                    </span>
                                                                                </button>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Order Status</p>
                                                <Input 
                                                    placeholder="Batch Ref / Tracking #" 
                                                    value={workOrderSent}
                                                    onChange={(e) => setWorkOrderSent(e.target.value)}
                                                    className="h-11 rounded-xl border-2 bg-background font-bold text-xs"
                                                />
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={handleSaveOfficeUse} 
                                            disabled={isSavingOffice}
                                            className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mt-4"
                                        >
                                            {isSavingOffice ? <Loader2 className="animate-spin h-4 w-4" /> : "APPLY ADMIN UPDATES"}
                                        </Button>
                                    </section>

                                    {requestTask?.staff && (
                                        <section className="space-y-4 p-6 bg-muted/20 rounded-[2rem] border-2">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-primary rounded-full" />
                                                Task Progress
                                            </h3>

                                            {/* Stage timeline */}
                                            <div className="space-y-0">
                                                {[
                                                    { label: "Assigned", at: requestTask.assignedAt },
                                                    { label: "Accepted by staff", at: requestTask.acknowledgedAt },
                                                    { label: "Work started", at: requestTask.startedAt },
                                                    { label: "Completed", at: requestTask.completedAt },
                                                ].map((stage, i, arr) => (
                                                    <div key={stage.label} className="flex gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${stage.at ? "bg-primary border-primary" : "bg-muted border-border"}`} />
                                                            {i < arr.length - 1 && (
                                                                <div className={`w-0.5 flex-1 min-h-[16px] ${stage.at && arr[i + 1].at ? "bg-primary" : "bg-border"}`} />
                                                            )}
                                                        </div>
                                                        <div className="pb-3 -mt-0.5">
                                                            <p className={`text-xs font-bold ${stage.at ? "" : "text-muted-foreground/50"}`}>{stage.label}</p>
                                                            {stage.at && (
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {new Date(stage.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Staff updates */}
                                            {requestTask.updates?.length > 0 && (
                                                <div className="space-y-2 pt-2 border-t">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Staff Updates</p>
                                                    {requestTask.updates.map((update: any, i: number) => (
                                                        <div key={i} className="p-3 bg-background rounded-xl border space-y-2">
                                                            <p className="text-[10px] text-muted-foreground font-bold">
                                                                {new Date(update.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                            </p>
                                                            {update.text && <p className="text-xs font-medium italic">"{update.text}"</p>}
                                                            {update.imageUrls?.length > 0 && (
                                                                <div className="flex gap-2 flex-wrap">
                                                                    {update.imageUrls.map((url: string, j: number) => (
                                                                        <img
                                                                            key={j}
                                                                            src={url}
                                                                            className="w-14 h-14 rounded-lg object-cover border cursor-zoom-in"
                                                                            onClick={() => window.open(url)}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {update.audioUrl && (
                                                                <audio controls src={update.audioUrl} className="w-full h-8" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Resident feedback */}
                                            {requestTask.rating !== undefined && (
                                                <div className="pt-2 border-t space-y-1.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resident Feedback</p>
                                                    <p className="text-sm text-amber-500 tracking-widest">
                                                        {"★".repeat(requestTask.rating)}{"☆".repeat(Math.max(0, 5 - requestTask.rating))}
                                                        <span className="ml-2 text-xs text-foreground font-bold">{requestTask.rating}/5</span>
                                                    </p>
                                                    {requestTask.feedback && (
                                                        <p className="text-xs font-medium italic text-foreground/80">"{requestTask.feedback}"</p>
                                                    )}
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1 rounded-2xl h-12 border-2 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                                        <Button 
                                            variant="destructive" 
                                            className="h-12 w-12 rounded-2xl p-0 border-2 shadow-lg shadow-destructive/10"
                                            onClick={() => {
                                                if (confirm("Permanently delete this request?")) {
                                                    removeRequest({ id: selectedRequest._id })
                                                        .then(() => toast.success("Request deleted"))
                                                        .catch(() => toast.error("Delete failed"))
                                                    setIsDetailsOpen(false);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Guest Profile Popup */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="sm:max-w-sm rounded-[2rem] border-4">
                    <DialogHeader>
                        <DialogTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                            Guest Profile
                        </DialogTitle>
                    </DialogHeader>
                    {guestProfile === undefined ? (
                        <div className="py-10 text-center">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                        </div>
                    ) : guestProfile === null ? (
                        <p className="py-8 text-center text-xs text-muted-foreground">User not found — the account may have been deleted.</p>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-20 h-20 rounded-2xl border-2 bg-muted overflow-hidden flex items-center justify-center text-primary text-2xl font-black">
                                    {guestProfile.imageUrl ? (
                                        <img src={guestProfile.imageUrl} alt={guestProfile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        guestProfile.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{guestProfile.name}</h3>
                                    <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase mt-1">
                                        {(guestProfile.userSubcategory || guestProfile.role || "resident").replace("_", " ")}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between p-3 bg-muted/40 rounded-xl border">
                                    <span className="font-black uppercase text-[10px] text-muted-foreground">Email</span>
                                    <span className="font-bold truncate ml-3">{guestProfile.email}</span>
                                </div>
                                {guestProfile.roomNumber && (
                                    <div className="flex justify-between p-3 bg-muted/40 rounded-xl border">
                                        <span className="font-black uppercase text-[10px] text-muted-foreground">Room</span>
                                        <span className="font-bold">{guestProfile.roomNumber}</span>
                                    </div>
                                )}
                                {guestProfile.phoneNumber && (
                                    <div className="flex justify-between p-3 bg-muted/40 rounded-xl border">
                                        <span className="font-black uppercase text-[10px] text-muted-foreground">Phone</span>
                                        <span className="font-bold">{guestProfile.phoneNumber}</span>
                                    </div>
                                )}
                                {guestProfile.durationStart && (
                                    <div className="flex justify-between p-3 bg-muted/40 rounded-xl border">
                                        <span className="font-black uppercase text-[10px] text-muted-foreground">Visit</span>
                                        <span className="font-bold">
                                            {new Date(guestProfile.durationStart).toLocaleDateString()} — {guestProfile.durationEnd ? new Date(guestProfile.durationEnd).toLocaleDateString() : "?"}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <Button
                                onClick={() => {
                                    setIsProfileOpen(false)
                                    setIsDetailsOpen(false)
                                    router.push("/users")
                                }}
                                className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px]"
                            >
                                Open Users Page
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
