"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Search, Filter, Trash2, ShoppingBag } from "lucide-react"

const STATUSES = ["pending", "in_progress", "completed"] as const

type Status = (typeof STATUSES)[number]

export default function OrdersPage() {
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const orders = useQuery(api.orders.list, { status: filterStatus }) ?? []

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

  const filteredOrders = orders.filter(o =>
    o.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.source.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ShoppingBag className="w-8 h-8 text-amber-400" />
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
            Order Management
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-amber-400 transition-colors" />
            <input
              type="text"
              placeholder="Search orders..."
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
              {STATUSES.map(s => (
                <option key={s} value={s} className="bg-slate-900">{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-amber-500/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-blue-200 uppercase text-[10px] tracking-widest font-bold">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Items / Summary</th>
                <th className="p-4 text-center">Source</th>
                <th className="p-4 text-center">Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredOrders.map((o: any) => (
                <tr key={o._id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-50 text-sm tracking-wide">{o.userName}</span>
                      <span className="text-[10px] text-white/20 font-mono italic">{o._id}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-blue-200/80 max-w-xs truncate">{o.summary}</p>
                    <span className="text-[10px] text-white/20 font-mono tracking-tighter">
                      {new Date(o.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[10px] text-blue-200/40 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {o.source}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-emerald-400">
                    Le {o.total.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => cycleStatus(o._id, o.status)}
                      className={`
                        px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all transform hover:scale-105
                        ${o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                          o.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                            'bg-amber-500/10 text-amber-300 border-amber-500/20'}
                      `}
                    >
                      {o.status.replace('_', ' ')}
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleDelete(o._id)}
                      className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
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
          <div className="p-12 text-center text-white/10 italic">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p>No orders found matching your criteria.</p>
          </div>
        )}


      </div>
    </div>
  )
}
