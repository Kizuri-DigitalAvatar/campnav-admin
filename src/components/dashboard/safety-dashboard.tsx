"use client"

import { useQuery } from "convex-helpers/react/cache"
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Activity, FileCheck, Bell, Calendar } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@convex/_generated/api"

const COLORS = ['#000000', '#333333', '#666666', '#999999', '#ff6b6b', '#fbbf24', '#10b981'];

export default function SafetyDashboard() {
  const safetyKPIs = useQuery(api.safety.getSafetyKPIs)
  const activeBroadcasts = safetyKPIs?.activeBroadcasts ?? 0
  const openIncidents = safetyKPIs?.openIncidents ?? 0

  const severityData = safetyKPIs ? Object.entries(safetyKPIs.incidentsBySeverity).map(([severity, count]) => ({
    severity: severity.replace('_', ' ').toUpperCase(),
    count,
    fill: severity === 'critical' ? '#ff6b6b' : severity === 'high' ? '#fbbf24' : severity === 'medium' ? '#f59e0b' : '#10b981'
  })) : []

  const typeData = safetyKPIs ? Object.entries(safetyKPIs.incidentsByType).map(([type, count]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    count,
    fill: COLORS[Object.keys(safetyKPIs.incidentsByType).indexOf(type) % COLORS.length]
  })) : []

  const locationData = safetyKPIs ? Object.entries(safetyKPIs.incidentsByLocation).map(([location, count]) => ({
    location: location.toUpperCase(),
    count,
    fill: COLORS[Object.keys(safetyKPIs.incidentsByLocation).indexOf(location) % COLORS.length]
  })) : []

  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSafetyScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 70) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">
          Safety Management
        </h2>
        <p className="text-muted-foreground mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Health, Safety & Environment Analytics</p>
      </header>

      {/* Key Safety Metrics */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Overall Safety Score', value: `${safetyKPIs?.overallSafetyScore || 0}%`, icon: Shield, loading: safetyKPIs === undefined, color: getSafetyScoreColor(safetyKPIs?.overallSafetyScore || 0) },
          { label: 'Total Incidents (30d)', value: safetyKPIs?.totalIncidents, icon: AlertTriangle, loading: safetyKPIs === undefined },
          { label: 'Critical Incidents', value: safetyKPIs?.criticalIncidents, icon: XCircle, loading: safetyKPIs === undefined },
          { label: 'Days Without Incident', value: safetyKPIs?.daysWithoutIncident === 999 ? '∞' : safetyKPIs?.daysWithoutIncident || 0, icon: Calendar, loading: safetyKPIs === undefined },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-2xl bg-muted flex items-center justify-center ${stat.color ? '' : ''}`}>
                <stat.icon size={20} className={stat.color || 'text-foreground'} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50">SAFE_V.{i + 1}</span>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</p>
              {stat.loading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <p className={`text-2xl font-black font-mono ${stat.color || ''}`}>{stat.value ?? 0}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Safety Score Overview */}
      <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield size={18} />
            Safety Performance Overview
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">PERFORMANCE_METRICS</span>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {[
            { label: 'Overall Safety Score', value: safetyKPIs?.overallSafetyScore || 0, max: 100 },
            { label: 'Incident Score', value: safetyKPIs?.safetyIncidentScore || 0, max: 100 },
            { label: 'Audit Score', value: safetyKPIs?.auditScore || 0, max: 100 },
          ].map((metric, i) => (
            <div key={i} className="text-center">
              <div className={`relative w-32 h-32 mx-auto mb-4 rounded-full ${getSafetyScoreBg(metric.value)} flex items-center justify-center`}>
                <div className="text-center">
                  <div className={`text-3xl font-black font-mono ${getSafetyScoreColor(metric.value)}`}>
                    {metric.value}
                  </div>
                  <div className="text-[8px] uppercase font-bold text-muted-foreground mt-1">
                    /{metric.max}
                  </div>
                </div>
              </div>
              <h4 className="text-sm font-bold">{metric.label}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Incident Severity Distribution */}
        <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={18} />
              Incident Severity
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">SEVERITY_BREAKDOWN</span>
          </div>
          <div className="h-[300px] w-full relative">
            {safetyKPIs === undefined && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full border-[20px] bg-transparent border-muted" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="count"
                >
                  {severityData.map((entry, index) => (
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
                  formatter={(value) => <span className="text-xs font-bold text-muted-foreground ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Type Breakdown */}
        <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileCheck size={18} />
              Incident Categories
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">TYPE_ANALYSIS</span>
          </div>
          <div className="h-[300px] w-full relative">
            {safetyKPIs === undefined && (
              <div className="absolute inset-0 z-10 flex flex-col gap-4 p-4">
                <div className="flex items-end gap-2 h-full">
                  <Skeleton className="flex-1 h-[60%]" />
                  <Skeleton className="flex-1 h-[80%]" />
                  <Skeleton className="flex-1 h-[40%]" />
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
                <XAxis
                  dataKey="type"
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
                  dataKey="count"
                  radius={[8, 8, 8, 8]}
                  barSize={40}
                  fill="#000000"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Incident Trends */}
      <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp size={18} />
            7-Day Incident Trends
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">HISTORICAL_TRENDS</span>
        </div>
        <div className="h-[300px] w-full relative">
          {safetyKPIs === undefined && (
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
            <AreaChart data={safetyKPIs?.trends}>
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
              <Area
                type="monotone"
                dataKey="incidents"
                stroke="#000000"
                strokeWidth={2}
                fill="#000000"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="critical"
                stroke="#ff6b6b"
                strokeWidth={2}
                fill="#ff6b6b"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="high"
                stroke="#fbbf24"
                strokeWidth={2}
                fill="#fbbf24"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit and Emergency Status */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Audit Performance */}
        <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileCheck size={18} />
              Audit Performance
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">COMPLIANCE_STATUS</span>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Total Audits (30d)', value: safetyKPIs?.totalAudits, icon: FileCheck },
              { label: 'Passed Audits', value: safetyKPIs?.passedAudits, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Failed Audits', value: safetyKPIs?.failedAudits, icon: XCircle, color: 'text-red-600' },
              { label: 'Average Score', value: `${safetyKPIs?.averageAuditScore || 0}%`, icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <stat.icon size={16} className={stat.color || 'text-muted-foreground'} />
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                <span className={`text-lg font-black font-mono ${stat.color || ''}`}>
                  {safetyKPIs === undefined ? <Skeleton className="h-6 w-12" /> : stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Broadcasts */}
        <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 md:mb-10">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Bell size={18} />
              Emergency Status
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">ACTIVE_ALERTS</span>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Active Broadcasts', value: activeBroadcasts, icon: Bell, color: activeBroadcasts > 0 ? 'text-red-600' : 'text-green-600' },
              { label: 'Resolution Rate', value: `${safetyKPIs?.resolutionRate || 0}%`, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Open Incidents', value: openIncidents, icon: AlertTriangle, color: openIncidents > 0 ? 'text-orange-600' : 'text-green-600' },
              { label: 'Resolved Incidents', value: safetyKPIs?.resolvedIncidents, icon: CheckCircle, color: 'text-green-600' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <stat.icon size={16} className={stat.color || 'text-muted-foreground'} />
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                <span className={`text-lg font-black font-mono ${stat.color || ''}`}>
                  {safetyKPIs === undefined ? <Skeleton className="h-6 w-12" /> : stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
