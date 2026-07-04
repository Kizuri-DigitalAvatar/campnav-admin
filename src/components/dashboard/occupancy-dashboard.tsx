"use client"

import { useQuery } from "convex-helpers/react/cache"
import { Bed, BedDouble, Users, DollarSign, TrendingUp, AlertTriangle } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@convex/_generated/api"

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#ff6b6b'];

export default function OccupancyDashboard() {
  const occupancyStats = useQuery(api.rooms.getOccupancyStats)
  const occupancyTrends = useQuery(api.rooms.getOccupancyTrends, { days: 30 })

  const statusData = occupancyStats ? [
    { name: "Occupied", value: occupancyStats.occupiedRooms, fill: "#000000" },
    { name: "Available", value: occupancyStats.availableRooms, fill: "#666666" },
    { name: "Maintenance", value: occupancyStats.maintenanceRooms, fill: "#ff6b6b" },
  ] : []

  const categoryData = occupancyStats ? Object.entries(occupancyStats.categoryStats).map(([category, stats]) => ({
    category,
    occupied: stats.occupied,
    available: stats.available,
    maintenance: stats.maintenance,
    total: stats.total,
    occupancyRate: stats.total > 0 ? Math.round((stats.occupied / stats.total) * 1000) / 10 : 0
  })) : []

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">
          Occupancy Management
        </h2>
        <p className="text-muted-foreground mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Real-time Room Status & Analytics</p>
      </header>

      {/* Key Metrics */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Rooms', value: occupancyStats?.totalRooms, icon: Bed, loading: occupancyStats === undefined },
          { label: 'Occupancy Rate', value: `${occupancyStats?.occupancyRate || 0}%`, icon: TrendingUp, loading: occupancyStats === undefined },
          { label: 'Available Rooms', value: occupancyStats?.availableRooms, icon: BedDouble, loading: occupancyStats === undefined },
          { label: 'Revenue Utilization', value: `${occupancyStats?.revenueUtilization || 0}%`, icon: DollarSign, loading: occupancyStats === undefined },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-muted flex items-center justify-center">
                <stat.icon size={20} className="text-foreground" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50">OCC_V.{i + 1}</span>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</p>
              {stat.loading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <p className="text-2xl font-black font-mono">{stat.value ?? 0}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Room Status Distribution */}
        <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Bed size={18} />
              Room Status Distribution
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">STATUS_BREAKDOWN</span>
          </div>
          <div className="h-[300px] w-full relative">
            {occupancyStats === undefined && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full border-[20px] bg-transparent border-muted" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(1 0 0)',
                    border: '1px solid oklch(0.922 0 0)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value) => <span className="text-xs font-bold text-muted-foreground ml-2 capitalize">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users size={18} />
              Category Performance
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">CATEGORY_ANALYSIS</span>
          </div>
          <div className="h-[300px] w-full relative">
            {occupancyStats === undefined && (
              <div className="absolute inset-0 z-10 flex flex-col gap-4 p-4">
                <div className="flex items-end gap-2 h-full">
                  <Skeleton className="flex-1 h-[60%]" />
                  <Skeleton className="flex-1 h-[80%]" />
                  <Skeleton className="flex-1 h-[40%]" />
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke="oklch(0.556 0 0)"
                  tick={{ fill: 'oklch(0.556 0 0)', fontSize: 10, fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="oklch(0.556 0 0)"
                  tick={{ fill: 'oklch(0.556 0 0)', fontSize: 10, fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(1 0 0)',
                    border: '1px solid oklch(0.922 0 0)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  cursor={{ fill: 'oklch(0.97 0 0)' }}
                />
                <Bar
                  dataKey="occupied"
                  radius={[8, 8, 8, 8]}
                  barSize={40}
                  fill="#000000"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Occupancy Trends */}
      <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp size={18} />
            30-Day Occupancy Trends
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">HISTORICAL_DATA</span>
        </div>
        <div className="h-[300px] w-full relative">
          {occupancyTrends === undefined && (
            <div className="absolute inset-0 z-10 flex flex-col gap-4 p-4">
              <div className="flex items-end gap-2 h-full">
                <Skeleton className="flex-1 h-[60%]" />
                <Skeleton className="flex-1 h-[70%]" />
                <Skeleton className="flex-1 h-[50%]" />
                <Skeleton className="flex-1 h-[80%]" />
              </div>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupancyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="oklch(0.556 0 0)"
                tick={{ fill: 'oklch(0.556 0 0)', fontSize: 10, fontWeight: 'bold' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="oklch(0.556 0 0)"
                tick={{ fill: 'oklch(0.556 0 0)', fontSize: 10, fontWeight: 'bold' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(1 0 0)',
                  border: '1px solid oklch(0.922 0 0)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
                cursor={{ fill: 'oklch(0.97 0 0)' }}
              />
              <Line
                type="monotone"
                dataKey="occupancy"
                stroke="#000000"
                strokeWidth={3}
                dot={{ fill: '#000000', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Details Table */}
      <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle size={18} />
            Category Performance Details
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">DETAILED_ANALYSIS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Occupied</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Available</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Maintenance</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Occupancy Rate</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.map((category, index) => (
                <tr key={category.category} className={`border-b border-border ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                  <td className="py-3 px-4 text-sm font-medium capitalize">{category.category}</td>
                  <td className="py-3 px-4 text-sm text-center font-mono">{category.total}</td>
                  <td className="py-3 px-4 text-sm text-center font-mono text-green-600">{category.occupied}</td>
                  <td className="py-3 px-4 text-sm text-center font-mono text-blue-600">{category.available}</td>
                  <td className="py-3 px-4 text-sm text-center font-mono text-orange-600">{category.maintenance}</td>
                  <td className="py-3 px-4 text-sm text-center font-mono">
                    <span className={`font-bold ${category.occupancyRate >= 80 ? 'text-green-600' : category.occupancyRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {category.occupancyRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
