"use client"

import { useQuery } from "convex-helpers/react/cache"
import Link from "next/link"
import {
  Users, ShoppingBag, Activity, Bell,
  ClipboardList, BedDouble, CalendarClock, Wrench,
  Building, Megaphone, Settings, PieChart as PieIcon, BarChart2,
  TrendingUp, ArrowUpRight, Zap, Shield
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@convex/_generated/api"

// Donut / pie segment colors
const COLORS = ['#2b6ff0', '#38bdf8', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1']

// Semantic status colors
const C_PENDING     = '#f59e0b'
const C_IN_PROGRESS = '#3b82f6'
const C_COMPLETED   = '#10b981'
const C_BAD         = '#ef4444'

const tooltipContentStyle = {
  backgroundColor: 'oklch(0.998 0.001 90 / 0.92)',
  backdropFilter: 'blur(12px)',
  border: '1px solid oklch(0.908 0.005 84)',
  borderRadius: '16px',
  boxShadow: '0 2px 3px rgb(16 24 40 / 0.04), 0 12px 28px -6px rgb(16 24 40 / 0.16)',
  fontSize: '12px',
  fontWeight: 'bold',
}

const barCursor = { fill: 'oklch(0.97 0 0)' }

function AxisX({ dataKey }: { dataKey?: string }) {
  return (
    <XAxis
      dataKey={dataKey}
      stroke="oklch(0.556 0 0)"
      tick={{ fill: 'oklch(0.556 0 0)', fontSize: 10, fontWeight: 'bold' }}
      axisLine={false}
      tickLine={false}
    />
  )
}

function AxisY() {
  return (
    <YAxis
      stroke="oklch(0.556 0 0)"
      tick={{ fill: 'oklch(0.556 0 0)', fontSize: 10, fontWeight: 'bold' }}
      axisLine={false}
      tickLine={false}
    />
  )
}

function Grid() {
  return <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
}

// ── Upgraded card shells ──────────────────────────────────────────────────

function ChartCard({
  title, icon: Icon, tag, accentColor, headline, headlineLabel, loading, children,
}: {
  title: string
  icon: React.ElementType
  tag: string
  accentColor: string
  headline?: string | number
  headlineLabel?: string
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      {/* Colored accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55)` }} />
      <div className="p-6 md:p-7">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl tile-3d">
              <Icon size={16} style={{ color: accentColor }} />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight">{title}</h4>
              <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">{tag}</span>
            </div>
          </div>
          {headline !== undefined && (
            <div className="text-right">
              {loading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-black font-mono tabular-nums" style={{ color: accentColor }}>
                  {headline}
                </p>
              )}
              {headlineLabel && (
                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{headlineLabel}</p>
              )}
            </div>
          )}
        </div>
        <div className="h-[230px] w-full relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-end gap-2 p-2">
              {[55, 80, 40, 65, 50].map((h, i) => (
                <Skeleton key={i} className="flex-1 rounded-xl" style={{ height: `${h}%` }} />
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

function DonutCard({
  title, icon: Icon, tag, accentColor, centerValue, centerLabel, loading, children,
}: {
  title: string
  icon: React.ElementType
  tag: string
  accentColor: string
  centerValue?: string | number
  centerLabel?: string
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55)` }} />
      <div className="p-6 md:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl tile-3d">
              <Icon size={16} style={{ color: accentColor }} />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight">{title}</h4>
              <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">{tag}</span>
            </div>
          </div>
          {centerValue !== undefined && !loading && (
            <div className="text-right">
              <p className="text-2xl font-black font-mono tabular-nums" style={{ color: accentColor }}>
                {centerValue}
              </p>
              {centerLabel && (
                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{centerLabel}</p>
              )}
            </div>
          )}
        </div>
        <div className="h-[230px] w-full relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Skeleton className="h-40 w-40 rounded-full border-[18px] bg-transparent border-muted" />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, tag, color }: { title: string; tag: string; color: string }) {
  return (
    <div className="flex items-center gap-4 pb-4 border-b">
      <div className="w-1 h-6 rounded-full" style={{ background: color }} />
      <h3 className="text-lg font-black tracking-tight">{title}</h3>
      <span className="text-[9px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {tag}
      </span>
    </div>
  )
}

// ── Multi-metric stat row (like 420h / 240h / 180h) ──────────────────────

function MetricRow({ metrics, loading }: {
  metrics: { label: string; value: string | number; color: string }[]
  loading: boolean
}) {
  return (
    <div className="flex gap-8">
      {metrics.map((m, i) => (
        <div key={i}>
          {loading ? (
            <Skeleton className="h-7 w-14 mb-1" />
          ) : (
            <p className="text-2xl font-black font-mono tabular-nums" style={{ color: m.color }}>{m.value}</p>
          )}
          <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{m.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function Home() {
  // Overview
  const userStats = useQuery(api.users.getStats)
  const tasks = useQuery(api.tasks.list)

  // Commerce
  const orders = useQuery(api.orders.list, { status: "all" })
  const requests = useQuery(api.requests.list, { status: "all" })

  // Camp Operations
  const occupancyStats = useQuery(api.rooms.getOccupancyStats)
  const rnrStats = useQuery(api.rnr.getRnRStats)
  const facilityStats = useQuery(api.facilities.getFacilityStats, {})
  const maintenanceStats = useQuery(api.maintenance.getMaintenanceStats)

  // --- Task data ---
  const taskList = tasks || []
  const taskPending   = taskList.filter((t: any) => t.status === "pending").length
  const taskProgress  = taskList.filter((t: any) => t.status === "in_progress" || t.status === "confirmed").length
  const taskCompleted = taskList.filter((t: any) => t.status === "completed").length
  const taskData = [
    { name: "Pending",     value: taskPending,   fill: C_PENDING },
    { name: "In Progress", value: taskProgress,  fill: C_IN_PROGRESS },
    { name: "Completed",   value: taskCompleted, fill: C_COMPLETED },
  ]

  // --- Order data ---
  const orderList = orders || []
  const orderPending   = orderList.filter((o: any) => o.status === "pending").length
  const orderProgress  = orderList.filter((o: any) => o.status === "in_progress").length
  const orderCompleted = orderList.filter((o: any) => o.status === "completed").length
  const orderFailed    = orderList.filter((o: any) => o.status === "failed").length
  const orderStatusData = [
    { name: "Pending",     value: orderPending,   fill: C_PENDING },
    { name: "In Progress", value: orderProgress,  fill: C_IN_PROGRESS },
    { name: "Completed",   value: orderCompleted, fill: C_COMPLETED },
    { name: "Failed",      value: orderFailed,    fill: C_BAD },
  ]
  const orderSourceData = [
    { name: "Room Service", value: orderList.filter((o: any) => o.source === "room_service").length },
    { name: "Shop",         value: orderList.filter((o: any) => o.source === "shop").length },
  ]

  // --- Request data ---
  const requestList = requests || []
  const reqPending   = requestList.filter((r: any) => r.status === "pending").length
  const reqProgress  = requestList.filter((r: any) => r.status === "in_progress").length
  const reqCompleted = requestList.filter((r: any) => r.status === "completed").length
  const reqRejected  = requestList.filter((r: any) => r.status === "rejected").length
  const requestData = [
    { name: "Pending",     value: reqPending,   fill: C_PENDING },
    { name: "In Progress", value: reqProgress,  fill: C_IN_PROGRESS },
    { name: "Completed",   value: reqCompleted, fill: C_COMPLETED },
    { name: "Rejected",    value: reqRejected,  fill: C_BAD },
  ]

  // --- Occupancy data ---
  const occupancyData = occupancyStats ? [
    { name: "Occupied",    value: occupancyStats.occupiedRooms,    fill: C_IN_PROGRESS },
    { name: "Available",   value: occupancyStats.availableRooms,   fill: C_COMPLETED },
    { name: "Maintenance", value: occupancyStats.maintenanceRooms, fill: C_BAD },
  ] : []

  // --- RnR data ---
  const rnrStatusData = rnrStats ? [
    { name: "Pending",   value: rnrStats.pendingRequests,   fill: C_PENDING },
    { name: "Approved",  value: rnrStats.approvedRequests,  fill: C_IN_PROGRESS },
    { name: "Completed", value: rnrStats.completedRequests, fill: C_COMPLETED },
    { name: "Rejected",  value: rnrStats.rejectedRequests,  fill: C_BAD },
  ] : []

  // --- Facility data ---
  const facilityData = facilityStats?.facilityStats
    ? Object.entries(facilityStats.facilityStats).map(([key, val]: [string, any]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        Confirmed: val.confirmed,
        Completed: val.completed,
        Cancelled: val.cancelled,
      }))
    : []

  // --- Maintenance data ---
  const maintenanceData = maintenanceStats ? [
    { name: "Pending",     value: maintenanceStats.pendingTasks,    fill: C_PENDING },
    { name: "In Progress", value: maintenanceStats.inProgressTasks, fill: C_IN_PROGRESS },
    { name: "Completed",   value: maintenanceStats.completedTasks,  fill: C_COMPLETED },
    { name: "Overdue",     value: maintenanceStats.overdueTasks,    fill: C_BAD },
  ] : []

  const kpiCards = [
    {
      label: 'Registered Users',
      value: userStats?.totalUsers,
      sub: `${userStats?.onSiteCount ?? 0} on site`,
      icon: Users,
      loading: userStats === undefined,
      accent: '#8b5cf6',
      iconBg: 'rgba(139,92,246,0.1)',
    },
    {
      label: 'Total Orders',
      value: orders?.length,
      sub: `${orderPending} pending`,
      icon: ShoppingBag,
      loading: orders === undefined,
      accent: '#3b82f6',
      iconBg: 'rgba(59,130,246,0.1)',
    },
    {
      label: 'Active Entries',
      value: userStats?.activeVisitors,
      sub: `${userStats?.onLeaveCount ?? 0} on leave`,
      icon: Activity,
      loading: userStats === undefined,
      accent: '#10b981',
      iconBg: 'rgba(16,185,129,0.1)',
    },
    {
      label: 'Service Requests',
      value: requests?.length,
      sub: `${reqPending} pending`,
      icon: Bell,
      loading: requests === undefined,
      accent: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.1)',
    },
  ]

  return (
    <div className="space-y-10 md:space-y-12">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase font-black tracking-[0.25em] text-primary mb-1">
            Real-time Operations
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">
            CampNav Analytics{' '}
            <span className="text-muted-foreground/50 font-bold">at a glance</span>
          </h2>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-muted-foreground tile-3d px-3.5 py-2 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_oklch(0.696_0.17_162.48)]" />
          LIVE
        </div>
      </header>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((stat, i) => (
          <div
            key={i}
            className="glass-card card-lift rounded-3xl overflow-hidden group"
          >
            {/* top accent stripe */}
            <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${stat.accent}, ${stat.accent}55)` }} />
            <div className="p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-2xl tile-3d group-hover:-translate-y-0.5 transition-transform duration-300">
                  <stat.icon size={18} style={{ color: stat.accent }} />
                </div>
                <ArrowUpRight size={14} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground mb-1">
                  {stat.label}
                </p>
                {stat.loading ? (
                  <Skeleton className="h-8 w-20 mb-1" />
                ) : (
                  <p className="text-3xl font-black font-mono tabular-nums text-foreground">
                    {stat.value ?? 0}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <SectionHeader title="Overview" tag="USERS & TASKS" color="#8b5cf6" />

        {/* multi-metric strip */}
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">

          {/* User Roles donut */}
          <DonutCard
            title="User Roles"
            icon={Users}
            tag="ROLE_SEGMENTATION"
            accentColor="#8b5cf6"
            centerValue={userStats?.totalUsers ?? '—'}
            centerLabel="Total Users"
            loading={userStats === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userStats?.byRole || []}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(userStats?.byRole || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} />
                <Legend
                  layout="vertical" align="right" verticalAlign="middle"
                  iconType="circle" iconSize={8}
                  formatter={(v) => (
                    <span className="text-xs font-bold text-muted-foreground ml-1 capitalize">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </DonutCard>

          {/* Departments bar */}
          <ChartCard
            title="Departments"
            icon={Building}
            tag="STAFF_DEPT"
            accentColor="#6366f1"
            headline={userStats?.byDepartment?.reduce((s: number, d: any) => s + d.value, 0) ?? '—'}
            headlineLabel="Staff Total"
            loading={userStats === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userStats?.byDepartment || []} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="oklch(0.556 0 0)"
                  tick={{ fill: 'oklch(0.556 0 0)', fontSize: 10, fontWeight: 'bold' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category" dataKey="name" width={88}
                  stroke="oklch(0.556 0 0)"
                  tick={{ fill: 'oklch(0.556 0 0)', fontSize: 9, fontWeight: 'bold' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip contentStyle={tooltipContentStyle} cursor={barCursor} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#6366f1" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Task Status bar */}
          <ChartCard
            title="Task Status"
            icon={ClipboardList}
            tag="TASK_STATUS"
            accentColor={C_IN_PROGRESS}
            headline={taskList.length}
            headlineLabel="Total Tasks"
            loading={tasks === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData}>
                <Grid />
                <AxisX dataKey="name" />
                <AxisY />
                <Tooltip contentStyle={tooltipContentStyle} cursor={barCursor} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={48}>
                  {taskData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Task multi-metric strip */}
        <div className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3">Task Breakdown</p>
            <MetricRow
              loading={tasks === undefined}
              metrics={[
                { label: "Pending",     value: taskPending,   color: C_PENDING },
                { label: "In Progress", value: taskProgress,  color: C_IN_PROGRESS },
                { label: "Completed",   value: taskCompleted, color: C_COMPLETED },
              ]}
            />
          </div>
          <div className="sm:ml-auto flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <TrendingUp size={14} className="text-emerald-500" />
            {tasks === undefined ? '—' : `${taskList.length} total tasks tracked`}
          </div>
        </div>
      </section>

      {/* ── COMMERCE ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <SectionHeader title="Commerce" tag="ORDERS & REQUESTS" color={C_IN_PROGRESS} />

        <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
          <ChartCard
            title="Order Status"
            icon={ShoppingBag}
            tag="STATUS_DIST"
            accentColor={C_IN_PROGRESS}
            headline={orderList.length}
            headlineLabel="Total Orders"
            loading={orders === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusData}>
                <Grid />
                <AxisX dataKey="name" />
                <AxisY />
                <Tooltip contentStyle={tooltipContentStyle} cursor={barCursor} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={42}>
                  {orderStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <DonutCard
            title="Order Sources"
            icon={PieIcon}
            tag="SOURCE_SPLIT"
            accentColor="#2b6ff0"
            loading={orders === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderSourceData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderSourceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} />
                <Legend
                  layout="vertical" align="right" verticalAlign="middle"
                  iconType="circle" iconSize={8}
                  formatter={(v) => (
                    <span className="text-xs font-bold text-muted-foreground ml-1">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </DonutCard>

          <ChartCard
            title="Requests"
            icon={Bell}
            tag="REQUEST_STATUS"
            accentColor={C_PENDING}
            headline={requestList.length}
            headlineLabel="Total Requests"
            loading={requests === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestData}>
                <Grid />
                <AxisX dataKey="name" />
                <AxisY />
                <Tooltip contentStyle={tooltipContentStyle} cursor={barCursor} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={42}>
                  {requestData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Commerce multi-metric strip */}
        <div className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3">Order Pipeline</p>
            <MetricRow
              loading={orders === undefined}
              metrics={[
                { label: "Pending",   value: orderPending,   color: C_PENDING },
                { label: "Active",    value: orderProgress,  color: C_IN_PROGRESS },
                { label: "Done",      value: orderCompleted, color: C_COMPLETED },
                { label: "Failed",    value: orderFailed,    color: C_BAD },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── CAMP OPERATIONS ───────────────────────────────────────── */}
      <section className="space-y-6">
        <SectionHeader title="Camp Operations" tag="OCCUPANCY · RNR · FACILITIES · MAINTENANCE" color={C_COMPLETED} />

        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
          {/* Occupancy donut */}
          <DonutCard
            title="Room Occupancy"
            icon={BedDouble}
            tag="OCCUPANCY_STATUS"
            accentColor={C_IN_PROGRESS}
            centerValue={occupancyStats ? `${occupancyStats.occupancyRate}%` : '—'}
            centerLabel="Occupancy Rate"
            loading={occupancyStats === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipContentStyle} />
                <Legend
                  layout="vertical" align="right" verticalAlign="middle"
                  iconType="circle" iconSize={8}
                  formatter={(v) => (
                    <span className="text-xs font-bold text-muted-foreground ml-1">{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </DonutCard>

          {/* RnR bar */}
          <ChartCard
            title="RnR / Leave"
            icon={CalendarClock}
            tag="RNR_STATUS"
            accentColor={C_PENDING}
            headline={rnrStats?.totalRequests ?? '—'}
            headlineLabel="Total Requests"
            loading={rnrStats === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rnrStatusData}>
                <Grid />
                <AxisX dataKey="name" />
                <AxisY />
                <Tooltip contentStyle={tooltipContentStyle} cursor={barCursor} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={42}>
                  {rnrStatusData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Facility bookings grouped bar */}
          <ChartCard
            title="Facility Bookings"
            icon={BarChart2}
            tag="BY_FACILITY_30D"
            accentColor="#6366f1"
            headline={facilityStats?.totalBookings ?? '—'}
            headlineLabel="Last 30 Days"
            loading={facilityStats === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityData} barGap={3}>
                <Grid />
                <AxisX dataKey="name" />
                <AxisY />
                <Tooltip contentStyle={tooltipContentStyle} cursor={barCursor} />
                <Bar dataKey="Confirmed" radius={[4, 4, 0, 0]} fill={C_IN_PROGRESS} barSize={16} />
                <Bar dataKey="Completed" radius={[4, 4, 0, 0]} fill={C_COMPLETED}   barSize={16} />
                <Bar dataKey="Cancelled" radius={[4, 4, 0, 0]} fill={C_BAD}         barSize={16} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(v) => (
                    <span className="text-xs font-bold text-muted-foreground ml-1">{v}</span>
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Maintenance bar */}
          <ChartCard
            title="Maintenance"
            icon={Wrench}
            tag="TASK_STATUS"
            accentColor={C_COMPLETED}
            headline={maintenanceStats ? `${maintenanceStats.completionRate}%` : '—'}
            headlineLabel="Completion Rate"
            loading={maintenanceStats === undefined}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceData}>
                <Grid />
                <AxisX dataKey="name" />
                <AxisY />
                <Tooltip contentStyle={tooltipContentStyle} cursor={barCursor} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={42}>
                  {maintenanceData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Occupancy + Maintenance multi-metric strip */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="glass-card rounded-3xl p-6">
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3">Rooms at a Glance</p>
            <MetricRow
              loading={occupancyStats === undefined}
              metrics={[
                { label: "Occupied",    value: occupancyStats?.occupiedRooms ?? 0,    color: C_IN_PROGRESS },
                { label: "Available",   value: occupancyStats?.availableRooms ?? 0,   color: C_COMPLETED },
                { label: "Maintenance", value: occupancyStats?.maintenanceRooms ?? 0, color: C_BAD },
              ]}
            />
          </div>
          <div className="glass-card rounded-3xl p-6">
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3">Maintenance Pipeline</p>
            <MetricRow
              loading={maintenanceStats === undefined}
              metrics={[
                { label: "Pending",  value: maintenanceStats?.pendingTasks ?? 0,    color: C_PENDING },
                { label: "Active",   value: maintenanceStats?.inProgressTasks ?? 0, color: C_IN_PROGRESS },
                { label: "Overdue",  value: maintenanceStats?.overdueTasks ?? 0,    color: C_BAD },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── Action Cards ──────────────────────────────────────────── */}
      <div className="grid gap-5 md:grid-cols-3">
        {[
          {
            icon: Megaphone,
            title: 'Universal Alert',
            desc: 'Broadcast a message to all currently active visitors and staff members.',
            button: 'Open Broadcaster',
            href: '/emergency',
            accent: C_BAD,
            iconBg: 'rgba(239,68,68,0.1)',
          },
          {
            icon: Settings,
            title: 'Configuration',
            desc: 'Adjust system parameters, pricing, and operational boundaries.',
            button: 'System Settings',
            href: '/access-control',
            accent: '#6366f1',
            iconBg: 'rgba(99,102,241,0.1)',
          },
        ].map((item, i) => (
          <div key={i} className="glass-card card-lift rounded-3xl overflow-hidden flex flex-col">
            <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${item.accent}, ${item.accent}55)` }} />
            <div className="p-7 flex flex-col justify-between flex-1">
              <div>
                <div className="w-11 h-11 rounded-2xl tile-3d flex items-center justify-center mb-5">
                  <item.icon size={22} style={{ color: item.accent }} />
                </div>
                <h4 className="text-lg font-black mb-2 tracking-tight">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
              <Link
                href={item.href}
                className="block w-full mt-7 font-black py-3.5 rounded-xl text-[10px] uppercase tracking-widest hover:opacity-90 hover:-translate-y-px transition-all text-center text-white"
                style={{
                  background: `linear-gradient(180deg, ${item.accent}, color-mix(in srgb, ${item.accent} 85%, black))`,
                  boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.2), 0 8px 18px -4px color-mix(in srgb, ${item.accent} 55%, transparent)`,
                }}
              >
                {item.button}
              </Link>
            </div>
          </div>
        ))}

        {/* Population card */}
        <div
          className="rounded-3xl overflow-hidden shadow-float flex flex-col"
          style={{
            background: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
            boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.2), 0 2px 3px rgb(16 24 40 / 0.06), 0 24px 48px -12px rgb(37 99 235 / 0.45)',
          }}
        >
          <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #93c5fd, #38bdf8, #10b981)' }} />
          <div className="p-7 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-xl bg-white/10">
                  <Zap size={16} className="text-white" />
                </div>
                <p className="text-[10px] uppercase font-black tracking-widest text-white/50">System Load</p>
              </div>
              <div className="text-center py-2">
                {userStats === undefined ? (
                  <Skeleton className="h-14 w-24 mx-auto mb-2 opacity-20" />
                ) : (
                  <div className="text-6xl font-black font-mono text-white mb-1 tabular-nums">
                    {userStats?.totalUsers ?? 0}
                  </div>
                )}
                <p className="text-[10px] uppercase font-black tracking-widest text-white/40">
                  Registered Users
                </p>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: '65%', background: 'linear-gradient(90deg, #93c5fd, #38bdf8)' }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold font-mono text-white/30">
                <span>0%</span>
                <span>QUOTA · 65%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
