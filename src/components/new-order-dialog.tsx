"use client"

import { useMemo, useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"
import { AlertTriangle, BedDouble, Loader2, Minus, Plus, Search, X } from "lucide-react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAdminSession } from "@/components/admin-session"

const RESIDENT_ROLES = ["resident", "camper", "visitor"]

export function NewOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const session = useAdminSession()
    const users = useQuery(api.users.list, open ? { role: "all" } : "skip")
    const products = useQuery(api.products.list, open ? {} : "skip")
    const createForResident = useMutation(api.orders.createForResident)

    const [residentQuery, setResidentQuery] = useState("")
    const [residentId, setResidentId] = useState<string | null>(null)
    const [source, setSource] = useState<"shop" | "room_service">("shop")
    const [productQuery, setProductQuery] = useState("")
    const [quantities, setQuantities] = useState<Record<string, number>>({})
    const [note, setNote] = useState("")
    const [saving, setSaving] = useState(false)

    const residents = useMemo(
        () => (users ?? []).filter((u: any) => RESIDENT_ROLES.includes(u.role)),
        [users]
    )
    const resident = residents.find((u: any) => u._id === residentId)
    const residentMatches = residents.filter((u: any) => {
        const q = residentQuery.trim().toLowerCase()
        return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.roomNumber?.toLowerCase().includes(q)
    })

    const availableProducts = (products ?? []).filter((p: any) => {
        const q = productQuery.trim().toLowerCase()
        return p.isAvailable && (!q || p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
    })
    const lines = (products ?? []).filter((p: any) => (quantities[p._id] ?? 0) > 0)
    const total = lines.reduce((sum: number, p: any) => sum + p.price * quantities[p._id], 0)

    function setQty(id: string, qty: number) {
        setQuantities((q) => ({ ...q, [id]: Math.max(0, qty) }))
    }

    function reset() {
        setResidentQuery("")
        setResidentId(null)
        setSource("shop")
        setProductQuery("")
        setQuantities({})
        setNote("")
    }

    function close() {
        reset()
        onOpenChange(false)
    }

    async function submit() {
        if (!resident || lines.length === 0) return
        setSaving(true)
        try {
            await createForResident({
                userId: resident._id,
                source,
                items: lines.map((p: any) => ({ productId: p._id, quantity: quantities[p._id] })),
                note: note.trim() || undefined,
                placedBy: (session?.userId || undefined) as any,
            })
            toast.success(`Order placed for ${resident.name}`, { description: `Delivering to Room ${resident.roomNumber}. They've been notified.` })
            close()
        } catch (err: any) {
            toast.error("Could not place order", { description: err?.message?.replace(/^.*Uncaught Error: /, "").split("\n")[0] })
        } finally {
            setSaving(false)
        }
    }

    const label = "text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
    const field = "w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"

    return (
        <Dialog open={open} onOpenChange={(o: boolean) => (o ? onOpenChange(true) : close())}>
            <DialogContent className="max-w-3xl! w-[95vw] max-h-[90vh] overflow-y-auto md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold">New Order for a Resident</h3>
                        <p className="text-xs text-muted-foreground mt-1">Delivered to their assigned room. They'll get a notification.</p>
                    </div>
                    <button type="button" onClick={close} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Resident */}
                    <div className="space-y-2">
                        <label className={label}>Resident / Guest</label>
                        {resident ? (
                            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold truncate">{resident.name}</p>
                                    {resident.roomNumber ? (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><BedDouble className="w-3 h-3" /> Room {resident.roomNumber}</p>
                                    ) : (
                                        <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No room assigned. Set one on the Users page first.</p>
                                    )}
                                </div>
                                <button type="button" onClick={() => setResidentId(null)} className="text-[10px] font-black uppercase tracking-widest text-primary shrink-0">Change</button>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input className={`${field} pl-10`} placeholder="Search by name, email or room..." value={residentQuery} onChange={(e) => setResidentQuery(e.target.value)} />
                                </div>
                                <div className="max-h-48 overflow-y-auto rounded-xl border divide-y">
                                    {users === undefined ? (
                                        <p className="p-4 text-xs text-muted-foreground">Loading...</p>
                                    ) : residentMatches.length === 0 ? (
                                        <p className="p-4 text-xs text-muted-foreground">No residents match.</p>
                                    ) : residentMatches.map((u: any) => (
                                        <button key={u._id} type="button" onClick={() => setResidentId(u._id)} className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center justify-between gap-3">
                                            <span className="text-sm font-semibold truncate">{u.name}</span>
                                            <span className={`text-[10px] font-bold shrink-0 ${u.roomNumber ? "text-muted-foreground" : "text-destructive"}`}>
                                                {u.roomNumber ? `Room ${u.roomNumber}` : "No room"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Source */}
                    <div className="space-y-2">
                        <label className={label}>Order Type</label>
                        <div className="flex gap-2">
                            {([["shop", "Shop"], ["room_service", "Room Service"]] as const).map(([value, text]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setSource(value)}
                                    className={`flex-1 h-10 rounded-xl border text-xs font-black uppercase tracking-widest transition-colors ${source === value ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-2">
                        <label className={label}>Items</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input className={`${field} pl-10`} placeholder="Search products..." value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
                        </div>
                        <div className="max-h-64 overflow-y-auto rounded-xl border divide-y">
                            {products === undefined ? (
                                <p className="p-4 text-xs text-muted-foreground">Loading...</p>
                            ) : availableProducts.length === 0 ? (
                                <p className="p-4 text-xs text-muted-foreground">No available products match.</p>
                            ) : availableProducts.map((p: any) => {
                                const qty = quantities[p._id] ?? 0
                                return (
                                    <div key={p._id} className={`flex items-center gap-3 px-4 py-2.5 ${qty > 0 ? "bg-primary/5" : ""}`}>
                                        <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden shrink-0">
                                            {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{p.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{p.category} · Le {p.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button type="button" onClick={() => setQty(p._id, qty - 1)} disabled={qty === 0} className="w-7 h-7 rounded-lg border flex items-center justify-center disabled:opacity-30"><Minus className="w-3 h-3" /></button>
                                            <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
                                            <button type="button" onClick={() => setQty(p._id, qty + 1)} className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-muted"><Plus className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <label className={label}>Note (optional)</label>
                        <input className={field} placeholder="e.g. Deliver after 6pm" value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-6 border-t">
                        <p className="sm:mr-auto text-sm">
                            {lines.length} item{lines.length === 1 ? "" : "s"} · <span className="font-black">Le {total.toFixed(2)}</span>
                        </p>
                        <button type="button" onClick={close} className="h-11 px-6 rounded-xl bg-muted font-bold text-sm hover:bg-muted/80">CANCEL</button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={saving || !resident || !resident.roomNumber || lines.length === 0}
                            className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            PLACE ORDER
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
