"use client"

import { useQuery } from "convex/react"
import { Users, ShoppingBag, TrendingUp, Activity, PieChart as PieIcon, BarChart as BarIcon, Megaphone, Settings } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"
import { api } from "../../../campnav-client/convex/_generated/api"

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#10b981', '#f59e0b'];

export default function Home() {
  const userStats = useQuery(api.users.getStats)
  const orders = useQuery(api.orders.list, { status: "all" })
  const orderList = orders || []

  const pending = orderList.filter((o: any) => o.status === "pending").length
  const inProgress = orderList.filter((o: any) => o.status === "in_progress").length
  const completed = orderList.filter((o: any) => o.status === "completed").length

  const orderData = [
    { name: "Pending", value: pending, fill: "#f59e0b" },
    { name: "In Progress", value: inProgress, fill: "#3b82f6" },
    { name: "Completed", value: completed, fill: "#10b981" },
  ]

  const roleData = userStats?.byRole || []

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
            CampNav Analytics
          </h2>
          <p className="text-blue-200/40 mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Real-time Operations Dashboard</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-6 flex items-center gap-4 border-blue-500/20 shadow-blue-500/5 shadow-xl">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-200/40">Registered Users</p>
            <p className="text-2xl font-bold text-white font-mono">{userStats?.totalUsers ?? "..."}</p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4 border-indigo-500/20 shadow-indigo-500/5 shadow-xl">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-200/40">Total Orders</p>
            <p className="text-2xl font-bold text-white font-mono">{orderList.length}</p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4 border-amber-500/20 shadow-amber-500/5 shadow-xl">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-amber-200/40">Active Entries</p>
            <p className="text-2xl font-bold text-white font-mono">{userStats?.activeVisitors ?? "..."}</p>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center gap-4 border-emerald-500/20 shadow-emerald-500/5 shadow-xl">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-200/40">Resolution</p>
            <p className="text-2xl font-bold text-white font-mono">
              {orderList.length ? Math.round((completed / orderList.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6 border-indigo-500/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-100">
              <BarIcon size={18} className="text-indigo-400" />
              Order Operations
            </h3>
            <span className="text-[10px] font-mono text-white/20">STATUS_DISTRIBUTION</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(79, 70, 229, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    backdropFilter: 'blur(8px)'
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  barSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 border-indigo-500/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-100">
              <PieIcon size={18} className="text-indigo-400" />
              User Demographics
            </h3>
            <span className="text-[10px] font-mono text-white/20">ROLE_SEGMENTATION</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(79, 70, 229, 0.2)',
                    borderRadius: '12px',
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value) => <span className="text-xs text-blue-200/60 font-medium ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
              <Megaphone size={20} className="text-blue-400" />
            </div>
            <h4 className="font-bold text-white mb-1">Universal Alert</h4>
            <p className="text-xs text-blue-200/40 leading-relaxed">Broadcast a message to all currently active visitors and staff members.</p>
          </div>
          <button className="glass-button w-full mt-6 bg-blue-600/20 hover:bg-blue-600/40 border-blue-600/30 text-xs">
            Open Broadcaster
          </button>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
              <Settings size={20} className="text-indigo-400" />
            </div>
            <h4 className="font-bold text-white mb-1">Configuration</h4>
            <p className="text-xs text-indigo-200/40 leading-relaxed">Adjust system parameters, pricing, and operational boundaries.</p>
          </div>
          <button className="glass-button w-full mt-6 bg-indigo-600/20 hover:bg-indigo-600/40 border-indigo-600/30 text-xs">
            System Settings
          </button>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-600/10 to-transparent">
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-white font-mono mb-2">{userStats?.totalUsers ?? 0}</div>
            <div className="text-[10px] uppercase font-black tracking-widest text-indigo-400">Database Population</div>
          </div>
          <div className="space-y-2">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[65%]" />
            </div>
            <div className="flex justify-between text-[10px] text-white/20 font-mono">
              <span>0%</span>
              <span>QUOTA: 65%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
