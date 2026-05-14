"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Search, ArrowLeft, Loader2, Plus, Minus,
    Wrench, Brush, Shirt, Truck, Bell, ChevronRight
} from "lucide-react"

const MAINT_CATEGORIES = ["Plumbing", "Electrical", "General Repairs", "AC", "Other"] as const
const SUB_CATEGORIES: Record<string, string[]> = {
    Plumbing: ["Taps/Faucets", "Toilet", "Pipes/Leaks", "Hot Water", "Other"],
    Electrical: ["Light Bulbs", "Sockets & Switches", "Appliances", "Wiring Fault", "Other"],
    "General Repairs": ["Doors/Locks", "Windows", "Furniture", "Walls/Ceiling", "Other"],
    AC: ["Not Cooling", "Leaking", "Strange Noise", "Won't Turn On", "Filter Cleaning", "Other"],
    Other: ["Other (please specify)"],
}
const LAUNDRY_ITEMS = [
    "Shirts", "Pants", "Handkerchiefs", "Undershirt", "Socks, pair",
    "Undershorts/Briefs", "Bra", "Panties", "Nightgown",
    "Pajamas - 2 pc.", "Pajamas - silk", "Blouse", "Slip", "Robe",
    "PPE Shirt", "PPE Trousers",
]
const DRY_CLEANING_ITEMS = [
    "Pants/Slacks", "Shirts", "Neck Tie", "Blouse", "Skirts",
    "Dress", "Sweater", "Suit - 2 pc.", "Suit - 3 pc.",
    "Jacket", "Sport Coat/Blazer", "Overcoat", "Vest",
]
const STARCH_OPTIONS = ["No Starch", "Light", "Medium", "Heavy"]
const SERVICE_TYPES = [
    { value: "maintenance", label: "Maintenance", icon: Wrench },
    { value: "housekeeping", label: "Housekeeping", icon: Brush },
    { value: "laundry", label: "Laundry", icon: Shirt },
    { value: "room_service", label: "Room Service", icon: Bell },
    { value: "delivery", label: "Delivery", icon: Truck },
]

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateRequestDialog({ open, onOpenChange }: Props) {
    const createRequest = useMutation(api.requests.create)
    const allUsers = useQuery(api.users.list, {}) ?? []
    const residents = (allUsers as any[]).filter((u) => u.role === "resident" || u.role === "guest")

    const [step, setStep] = useState<1 | 2>(1)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [userSearch, setUserSearch] = useState("")

    const [serviceType, setServiceType] = useState("maintenance")
    const [roomNumber, setRoomNumber] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState("routine")
    const [category, setCategory] = useState("Plumbing")
    const [subCategory, setSubCategory] = useState("")
    const [applianceModel, setApplianceModel] = useState("")
    const [dateNoticed, setDateNoticed] = useState("")
    const [accessPreference, setAccessPreference] = useState("allow_entry")
    const [specialAttention, setSpecialAttention] = useState(false)
    const [laundryItems, setLaundryItems] = useState<Record<string, number>>({})
    const [starch, setStarch] = useState("No Starch")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const filteredResidents = (residents as any[]).filter(u => {
        const q = userSearch.trim().toLowerCase()
        return !q
            || u.name?.toLowerCase().includes(q)
            || u.email?.toLowerCase().includes(q)
            || u.roomNumber?.toLowerCase().includes(q)
    })

    function selectUser(user: any) {
        setSelectedUser(user)
        setRoomNumber(user.roomNumber || "")
        setStep(2)
    }

    function resetForm() {
        setStep(1)
        setSelectedUser(null)
        setUserSearch("")
        setServiceType("maintenance")
        setRoomNumber("")
        setDescription("")
        setPriority("routine")
        setCategory("Plumbing")
        setSubCategory("")
        setApplianceModel("")
        setDateNoticed("")
        setAccessPreference("allow_entry")
        setSpecialAttention(false)
        setLaundryItems({})
        setStarch("No Starch")
    }

    function handleClose(open: boolean) {
        if (!open) resetForm()
        onOpenChange(open)
    }

    function updateLaundryQty(item: string, delta: number) {
        setLaundryItems(prev => {
            const current = prev[item] || 0
            const next = Math.max(0, current + delta)
            if (next === 0) {
                const { [item]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [item]: next }
        })
    }

    async function handleSubmit() {
        if (!selectedUser || !roomNumber.trim()) return
        setIsSubmitting(true)
        try {
            const base = {
                userId: selectedUser._id,
                type: serviceType,
                roomNumber: roomNumber.trim(),
                description: description.trim() || `${serviceType.replace("_", " ")} request`,
                priority,
            }
            const extra: any = {}
            if (serviceType === "maintenance") {
                extra.category = category
                extra.subCategory = subCategory
                if (applianceModel) extra.applianceModel = applianceModel.trim()
                if (dateNoticed) extra.dateNoticed = dateNoticed
                extra.accessPreference = accessPreference
            }
            if (serviceType === "housekeeping") {
                extra.specialAttention = specialAttention
            }
            if (serviceType === "laundry") {
                extra.laundryItems = Object.entries(laundryItems).map(([name, quantity]) => ({
                    name,
                    quantity,
                    type: LAUNDRY_ITEMS.includes(name) ? "laundry" : "dry_cleaning",
                }))
                extra.starch = starch
            }
            await createRequest({ ...base, ...extra })
            handleClose(false)
        } catch (err) {
            console.error(err)
            alert("Failed to create request. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const laundryCount = Object.values(laundryItems).reduce((a, b) => a + b, 0)

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-4 overflow-hidden p-0 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-primary px-8 pt-8 pb-6 text-primary-foreground shrink-0">
                    <div className="flex items-center gap-3">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[.3em] opacity-70">
                                {step === 1 ? "Step 1 of 2 — Select Resident" : "Step 2 of 2 — Request Details"}
                            </p>
                            <DialogTitle className="text-xl font-black tracking-tight uppercase mt-0.5">
                                {step === 1
                                    ? "Who is this for?"
                                    : `New ${serviceType.replace("_", " ")} Request`}
                            </DialogTitle>
                            {step === 2 && selectedUser && (
                                <p className="text-sm opacity-80 mt-0.5">
                                    {selectedUser.name}
                                    {selectedUser.roomNumber && ` · Room ${selectedUser.roomNumber}`}
                                    {selectedUser.userSubcategory && (
                                        <span className="ml-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">
                                            {selectedUser.userSubcategory}
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step 1: User selection */}
                {step === 1 && (
                    <div className="flex flex-col overflow-hidden flex-1">
                        <div className="px-6 py-4 border-b shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email or room number..."
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    className="pl-10 h-11 rounded-xl"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1.5">
                            {filteredResidents.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground">
                                    <p className="text-sm font-bold italic">No residents found</p>
                                    <p className="text-xs mt-1">Try a different search term</p>
                                </div>
                            ) : (
                                filteredResidents.map((user: any) => (
                                    <button
                                        key={user._id}
                                        onClick={() => selectUser(user)}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 hover:border-primary/40 hover:bg-primary/5 text-left transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/10 flex items-center justify-center font-black text-sm text-primary shrink-0">
                                            {user.name?.charAt(0) ?? "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{user.name}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {user.userSubcategory && (
                                                <span className="text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-lg uppercase tracking-wide">
                                                    {user.userSubcategory}
                                                </span>
                                            )}
                                            {user.roomNumber && (
                                                <span className="text-[10px] font-black bg-muted border-2 px-2 py-1 rounded-lg uppercase tracking-wide">
                                                    {user.roomNumber}
                                                </span>
                                            )}
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Request form */}
                {step === 2 && selectedUser && (
                    <div className="overflow-y-auto flex-1">
                        <div className="p-6 space-y-6">
                            {/* Service type */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Type</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {SERVICE_TYPES.map(({ value, label, icon: Icon }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setServiceType(value)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-[10px] font-black uppercase tracking-wide ${
                                                serviceType === value
                                                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <Icon size={18} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Room number */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Room / Location</p>
                                <Input
                                    placeholder="e.g. Cabin 101"
                                    value={roomNumber}
                                    onChange={e => setRoomNumber(e.target.value)}
                                    className="h-11 rounded-xl border-2 bg-gray-100"
                                />
                            </div>

                            {/* Maintenance fields */}
                            {serviceType === "maintenance" && (
                                <>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {MAINT_CATEGORIES.map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => { setCategory(cat); setSubCategory("") }}
                                                    className={`p-2.5 rounded-xl border-2 text-[11px] font-bold transition-all ${
                                                        category === cat
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Specific Issue</p>
                                        <Select value={subCategory} onValueChange={setSubCategory}>
                                            <SelectTrigger className="h-11 rounded-xl border-2">
                                                <SelectValue placeholder="Select issue type..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-2">
                                                {(SUB_CATEGORIES[category] ?? []).map(sub => (
                                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {category === "Electrical" && (
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Appliance Model (optional)</p>
                                            <Input
                                                placeholder="e.g. LG Fridge AR-200"
                                                value={applianceModel}
                                                onChange={e => setApplianceModel(e.target.value)}
                                                className="h-11 rounded-xl border-2"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Fault Noticed</p>
                                        <Input
                                            type="date"
                                            value={dateNoticed}
                                            onChange={e => setDateNoticed(e.target.value)}
                                            className="h-11 rounded-xl border-2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Property Access</p>
                                        <div className="space-y-2">
                                            {[
                                                { value: "allow_entry", label: "Entry Permitted", desc: "Tradesperson can attend without resident present" },
                                                { value: "must_be_present", label: "Must Be Present", desc: "Resident must be present during the visit" },
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setAccessPreference(opt.value)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                                        accessPreference === opt.value
                                                            ? "border-primary bg-primary/10"
                                                            : "border-border bg-background hover:bg-muted/30"
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${accessPreference === opt.value ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                                                        {accessPreference === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">{opt.label}</p>
                                                        <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Housekeeping fields */}
                            {serviceType === "housekeeping" && (
                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 hover:bg-muted/20 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={specialAttention}
                                        onChange={e => setSpecialAttention(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary"
                                    />
                                    <span className="text-xs font-bold">Requires special attention / extra care</span>
                                </label>
                            )}

                            {/* Laundry fields */}
                            {serviceType === "laundry" && (
                                <>
                                    {[
                                        { title: "Laundry Items", items: LAUNDRY_ITEMS },
                                        { title: "Dry Cleaning Items", items: DRY_CLEANING_ITEMS },
                                    ].map(section => (
                                        <div key={section.title} className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{section.title}</p>
                                            <div className="space-y-1 border-2 rounded-2xl p-3 max-h-44 overflow-y-auto">
                                                {section.items.map(item => (
                                                    <div key={item} className="flex items-center justify-between py-1.5">
                                                        <span className="text-xs font-medium">{item}</span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateLaundryQty(item, -1)}
                                                                disabled={!laundryItems[item]}
                                                                className="p-1 rounded-lg border disabled:opacity-30 hover:bg-muted transition-colors"
                                                            >
                                                                <Minus size={11} />
                                                            </button>
                                                            <span className="text-xs font-black w-5 text-center text-primary">
                                                                {laundryItems[item] || 0}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateLaundryQty(item, 1)}
                                                                className="p-1 rounded-lg border bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                            >
                                                                <Plus size={11} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Starch Preference</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {STARCH_OPTIONS.map(opt => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setStarch(opt)}
                                                    className={`py-2 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${
                                                        starch === opt
                                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                            : "bg-background text-muted-foreground hover:bg-muted"
                                                    }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Description */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {serviceType === "laundry" ? "Special Instructions" : "Description / Notes"}
                                </p>
                                <textarea
                                    rows={3}
                                    className="w-full rounded-2xl border-2 border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
                                    placeholder={
                                        serviceType === "maintenance" ? "Describe the issue in detail..." :
                                        serviceType === "housekeeping" ? "Any specific areas to focus on..." :
                                        serviceType === "laundry" ? "e.g. Hand wash only, extra care for silk items..." :
                                        "Enter request details..."
                                    }
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Priority (not for laundry) */}
                            {serviceType !== "laundry" && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</p>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger className="h-11 rounded-xl border-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-2">
                                            <SelectItem value="emergency" className="text-destructive font-black">Emergency (SLA: 4h)</SelectItem>
                                            <SelectItem value="urgent" className="text-amber-500 font-black">Urgent (SLA: 24h)</SelectItem>
                                            <SelectItem value="routine" className="font-black">Routine (SLA: 5d)</SelectItem>
                                            <SelectItem value="low" className="font-black">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    isSubmitting ||
                                    !roomNumber.trim() ||
                                    (serviceType === "laundry" && laundryCount === 0)
                                }
                                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : serviceType === "laundry" ? (
                                    `Submit Laundry (${laundryCount} item${laundryCount !== 1 ? "s" : ""})`
                                ) : (
                                    `Create ${serviceType.replace("_", " ")} Request`
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
