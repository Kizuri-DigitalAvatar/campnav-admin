"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Search, Filter, Trash2, ShoppingBag, CheckCircle2, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const STATUSES = ["pending", "in_progress", "completed", "failed"] as const

type Status = (typeof STATUSES)[number]

export default function OrdersPage() {
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSource, setFilterSource] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const orders = useQuery(api.orders.list, { 
    status: filterStatus,
    source: filterSource
  })
  const orderList = orders ?? []

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

  const filteredOrders = orderList.filter((o: any) =>
    o.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.source.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Order Management
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full md:w-64 pl-10 h-10 rounded-xl border bg-card focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-card border rounded-xl px-3 h-10">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              className="bg-transparent text-xs font-bold outline-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">ALL STATUS</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-card border rounded-xl px-3 h-10">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              className="bg-transparent text-xs font-bold outline-none cursor-pointer"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="all">ALL SOURCES</option>
              <option value="shop">SHOP</option>
              <option value="room_service">ROOM SERVICE</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px] tracking-widest font-black">
              <tr className="border-b">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Items / Summary</th>
                <th className="px-6 py-4 text-center">Source</th>
                <th className="px-6 py-4 text-center">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders === undefined ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-6 w-12 rounded-lg" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Skeleton className="h-6 w-20 mx-auto rounded-md" />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Skeleton className="h-8 w-24 mx-auto rounded-full" />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Skeleton className="h-8 w-8 ml-auto rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : (
                filteredOrders.map((o: any) => (
                <tr key={o._id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm tracking-tight">{o.userName}</span>
                      <span className="text-[10px] text-muted-foreground/50 font-mono tracking-tighter">{o._id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold bg-muted px-2 py-1 rounded-lg border uppercase italic">
                      {o.roomNumber || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium max-w-xs truncate">
                      {o.quantity ? `${o.quantity}x ${o.summary}` : o.summary}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(o.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-muted px-2 py-1 rounded-md border text-muted-foreground">
                      {o.source}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center font-bold font-mono">
                    Le {o.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      type="button"
                      onClick={() => cycleStatus(o._id, o.status)}
                      className={`
                        px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95
                        ${o.status === 'completed'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : o.status === 'in_progress'
                            ? 'bg-foreground/10 text-foreground border-foreground/20'
                            : o.status === 'failed'
                              ? 'bg-destructive/10 text-destructive border-destructive/30'
                              : 'bg-muted text-muted-foreground border-border'}
                      `}
                    >
                      {o.status.replace('_', ' ')}
                    </button>
                    {o.confirmedAt && (
                      <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Camper verified
                      </div>
                    )}
                    {o.status === 'failed' && !o.confirmedAt && (
                      <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-destructive font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Action needed
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button
                      onClick={() => handleDelete(o._id)}
                      className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {orders !== undefined && filteredOrders.length === 0 && (
          <div className="p-16 text-center text-muted-foreground/30">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">No orders found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
