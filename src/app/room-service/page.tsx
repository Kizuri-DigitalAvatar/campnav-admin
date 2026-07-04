"use client"

import { useState, useMemo } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "@convex/_generated/api"
import { Search, Filter, Trash2, Truck, Home, User as UserIcon, Clock, Plus, X, ShoppingCart, ChevronDown } from "lucide-react"
import { Id } from "@convex/_generated/dataModel"

const STATUSES = ["pending", "in_progress", "completed", "failed"] as const
type Status = (typeof STATUSES)[number]

// ── Create Order Modal ──────────────────────────────────────────────────────

function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const users = useQuery(api.users.listAll)
  const products = useQuery(api.products.list, {})

  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [userSearch, setUserSearch] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [customSummary, setCustomSummary] = useState("")
  const [cart, setCart] = useState<{ id: string; name: string; price: number; count: number }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createOrder = useMutation(api.orders.create)

  const selectedUser = useMemo(
    () => users?.find((u: any) => u._id === selectedUserId),
    [users, selectedUserId]
  )

  const filteredUsers = useMemo(() => {
    if (!users) return []
    const q = userSearch.toLowerCase()
    return users.filter((u: any) =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.roomNumber?.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [users, userSearch])

  // Auto-fill room number when user is selected
  const handleSelectUser = (user: any) => {
    setSelectedUserId(user._id)
    setRoomNumber(user.roomNumber || "")
    setUserSearch(user.name || user.email || "")
  }

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product._id)
      if (existing) return prev.map(i => i.id === product._id ? { ...i, count: i.count + 1 } : i)
      return [...prev, { id: product._id, name: product.name, price: product.price ?? 0, count: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.count, 0)
  const cartSummary = cart.map(i => `${i.name} x${i.count}`).join(", ")
  const finalSummary = cartSummary || customSummary.trim()
  const finalTotal = cart.length > 0 ? cartTotal : 0

  const canSubmit = selectedUserId && roomNumber.trim() && finalSummary

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await createOrder({
        userId: selectedUserId as Id<"users">,
        source: "room_service",
        roomNumber: roomNumber.trim(),
        summary: finalSummary,
        total: finalTotal,
        quantity: cart.length > 0 ? cart.reduce((s, i) => s + i.count, 0) : 1,
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert("Failed to create order.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-card rounded-[2rem] border-2 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">New Order</p>
              <h3 className="text-lg font-black tracking-tight">Create Room Service Order</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* User Search */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Guest / User *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email or room..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value)
                  if (selectedUserId) setSelectedUserId("")
                }}
                className="w-full pl-10 h-11 rounded-xl border-2 bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            {userSearch && !selectedUserId && (
              <div className="border-2 rounded-xl overflow-hidden shadow-lg">
                {filteredUsers.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">No users found</div>
                ) : (
                  filteredUsers.map((u: any) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email} {u.roomNumber ? `· Room ${u.roomNumber}` : ""}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border-2 border-primary/20">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                  {(selectedUser as any).name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{(selectedUser as any).name}</p>
                  <p className="text-[10px] text-muted-foreground">{(selectedUser as any).email}</p>
                </div>
                <button onClick={() => { setSelectedUserId(""); setUserSearch(""); setRoomNumber("") }}
                  className="p-1 rounded-full hover:bg-muted">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Room Number */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Room / Cabin Number *
            </label>
            <input
              type="text"
              placeholder="e.g. 101, E2, H1:1"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border-2 bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Product Picker */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              Select Products
            </label>
            {!products ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {products.filter((p: any) => p.isAvailable).map((product: any) => {
                  const inCart = cart.find(i => i.id === product._id)
                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => addToCart(product)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${
                        inCart
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-background border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{product.name}</p>
                        <p className="text-[10px] text-muted-foreground">Le {(product.price ?? 0).toFixed(2)}</p>
                      </div>
                      {inCart && (
                        <span className="shrink-0 text-[10px] font-black bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                          {inCart.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Cart summary */}
            {cart.length > 0 && (
              <div className="rounded-xl border-2 overflow-hidden">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 bg-muted/20">
                    <div>
                      <p className="text-xs font-bold">{item.name} <span className="text-muted-foreground">×{item.count}</span></p>
                      <p className="text-[10px] text-muted-foreground">Le {(item.price * item.count).toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 rounded-full hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</span>
                  <span className="text-sm font-black text-primary">Le {cartTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Custom summary (shown when no products selected) */}
          {cart.length === 0 && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                Or Enter Order Description *
              </label>
              <textarea
                placeholder="e.g. 2x Chicken Pasta, 1x Orange Juice..."
                value={customSummary}
                onChange={(e) => setCustomSummary(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 bg-background text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-muted text-muted-foreground text-xs font-black uppercase tracking-widest hover:opacity-80 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Placing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function RoomServiceOrdersPage() {
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  const orders = useQuery(api.orders.list, {
    status: filterStatus,
    source: "room_service",
  }) ?? [] as any[]

  const updateStatus = useMutation(api.orders.updateStatus)
  const deleteOrder = useMutation(api.orders.deleteOrder)

  async function cycleStatus(orderId: any, current: string) {
    const idx = STATUSES.indexOf(current as Status)
    const next = STATUSES[(idx + 1) % STATUSES.length]
    await updateStatus({ orderId, status: next })
  }

  async function handleDelete(id: any) {
    if (confirm("Are you sure you want to delete this order?")) {
      await deleteOrder({ id })
    }
  }

  const filteredOrders = orders.filter((o: any) =>
    o.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.roomNumber && o.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Room Service Orders</h1>
            <p className="text-sm text-muted-foreground font-medium">Manage and track guest dining and product deliveries.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input
              type="text"
              placeholder="Search by room, guest, or items..."
              className="w-full md:w-64 pl-10 h-11 rounded-2xl border-2 bg-card focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-card border-2 rounded-2xl px-4 h-11">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">ALL STATUS</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            New Order
          </button>
        </div>
      </div>

      <div className="bg-card border-2 rounded-[2.5rem] overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b-2 text-muted-foreground uppercase text-[10px] tracking-[0.2em] font-black">
              <tr>
                <th className="p-6">Room / Cabin</th>
                <th className="p-6">Guest</th>
                <th className="p-6">Order Summary</th>
                <th className="p-6 text-center">Total</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2">
              {filteredOrders.map((o: any) => (
                <tr key={o._id} className="hover:bg-muted/20 transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary border-2 border-primary/5">
                        <Home className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-tight italic">
                        {o.roomNumber || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{o.userName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]">{o._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground/80 line-clamp-1 italic">"{o.summary}"</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase">
                        <Clock className="h-3 w-3" />
                        {new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center font-black font-mono text-primary text-sm italic">
                    Le {(o.total ?? 0).toFixed(2)}
                  </td>
                  <td className="p-6 text-center">
                    <button
                      type="button"
                      onClick={() => cycleStatus(o._id, o.status)}
                      className={`
                        px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border-2 transition-all active:scale-95 shadow-sm
                        ${o.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : o.status === 'in_progress'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : o.status === 'failed'
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}
                      `}
                    >
                      {o.status.replace('_', ' ')}
                    </button>
                  </td>
                  <td className="p-6 text-right">
                    <button
                      onClick={() => handleDelete(o._id)}
                      className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-24 text-center bg-muted/10 border-t-2 border-dashed">
            <Truck className="w-16 h-16 mx-auto mb-4 opacity-10 text-primary" />
            <p className="text-muted-foreground font-black uppercase tracking-widest text-xs italic">No room service orders found</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create First Order
            </button>
          </div>
        )}
      </div>

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
