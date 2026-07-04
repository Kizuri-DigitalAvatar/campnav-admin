"use client"

import { createElement, useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { Bell, Send, AlertTriangle, CheckCircle, XCircle, Clock, Users, MapPin, Megaphone, Zap, Cloud, Flame, Shield, Activity } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

interface BroadcastFormData {
  type: string
  severity: string
  title: string
  message: string
  affectedAreas: string[]
  instructions: string[]
  estimatedDuration: string
  targetAudience: string[]
  deliveryChannels: string[]
}

const BROADCAST_TYPES = [
  { value: "weather", label: "Weather Alert", icon: Cloud, color: "text-blue-600 bg-blue-100" },
  { value: "fire", label: "Fire Emergency", icon: Flame, color: "text-red-600 bg-red-100" },
  { value: "security", label: "Security Alert", icon: Shield, color: "text-purple-600 bg-purple-100" },
  { value: "medical", label: "Medical Emergency", icon: Activity, color: "text-green-600 bg-green-100" },
  { value: "site_breakdown", label: "Site Breakdown", icon: Zap, color: "text-orange-600 bg-orange-100" },
]

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "text-green-600 bg-green-100" },
  { value: "medium", label: "Medium", color: "text-yellow-600 bg-yellow-100" },
  { value: "high", label: "High", color: "text-orange-600 bg-orange-100" },
  { value: "critical", label: "Critical", color: "text-red-600 bg-red-100" },
]

const AREAS = [
  { value: "camp", label: "Main Camp" },
  { value: "site_a", label: "Site A" },
  { value: "site_b", label: "Site B" },
  { value: "office", label: "Office Complex" },
  { value: "kitchen", label: "Kitchen Area" },
  { value: "recreation", label: "Recreation Area" },
]

const AUDIENCE_OPTIONS = [
  { value: "all_staff", label: "All Staff" },
  { value: "residents", label: "Residents" },
  { value: "visitors", label: "Visitors" },
  { value: "management", label: "Management" },
]

const DELIVERY_CHANNELS = [
  { value: "push", label: "Push Notifications" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "display_boards", label: "Display Boards" },
]

export default function EmergencyBroadcasts() {
  const broadcasts = useQuery(api.safety.getActiveBroadcasts, {}) || []
  const createBroadcast = useMutation(api.safety.createEmergencyBroadcast)
  const resolveBroadcast = useMutation(api.safety.resolveBroadcast)
  
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<BroadcastFormData>({
    type: "",
    severity: "",
    title: "",
    message: "",
    affectedAreas: [],
    instructions: [],
    estimatedDuration: "",
    targetAudience: [],
    deliveryChannels: [],
  })
  const canSubmit = formData.affectedAreas.length > 0 && formData.targetAudience.length > 0 && formData.deliveryChannels.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    
    try {
      await createBroadcast({
        type: formData.type,
        severity: formData.severity,
        title: formData.title,
        message: formData.message,
        affectedAreas: formData.affectedAreas,
        instructions: formData.instructions,
        estimatedDuration: formData.estimatedDuration,
        targetAudience: formData.targetAudience,
        deliveryChannels: formData.deliveryChannels,
      })
      
      // Reset form
      setFormData({
        type: "",
        severity: "",
        title: "",
        message: "",
        affectedAreas: [],
        instructions: [],
        estimatedDuration: "",
        targetAudience: [],
        deliveryChannels: [],
      })
      setShowForm(false)
    } catch (error) {
      console.error("Error creating broadcast:", error)
    }
  }

  const handleResolve = async (broadcastId: Id<"emergencyBroadcasts">) => {
    try {
      await resolveBroadcast({ id: broadcastId })
    } catch (error) {
      console.error("Error resolving broadcast:", error)
    }
  }

  const getTypeIcon = (type: string) => {
    const broadcastType = BROADCAST_TYPES.find(t => t.value === type)
    return broadcastType ? broadcastType.icon : Bell
  }

  const getTypeColor = (type: string) => {
    const broadcastType = BROADCAST_TYPES.find(t => t.value === type)
    return broadcastType ? broadcastType.color : "text-gray-600 bg-gray-100"
  }

  const getSeverityColor = (severity: string) => {
    const level = SEVERITY_LEVELS.find(l => l.value === severity)
    return level ? level.color : "text-gray-600 bg-gray-100"
  }

  const activeBroadcasts = broadcasts.filter(b => b.status === "active")
  const resolvedBroadcasts = broadcasts.filter(b => b.status === "resolved")

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">
          Emergency Broadcasts
        </h2>
        <p className="text-muted-foreground mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Critical Alert Management System</p>
      </header>

      {/* Quick Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Alerts', value: activeBroadcasts.length, icon: Bell, color: activeBroadcasts.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Critical Alerts', value: activeBroadcasts.filter(b => b.severity === "critical").length, icon: AlertTriangle, color: 'text-red-600' },
          { label: 'People Notified', value: broadcasts.reduce((sum, b) => sum + (b.targetAudience?.length || 0), 0), icon: Users },
          { label: 'Resolved Today', value: resolvedBroadcasts.filter(b => b.resolvedAt && new Date(b.resolvedAt).toDateString() === new Date().toDateString()).length, icon: CheckCircle, color: 'text-green-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-muted flex items-center justify-center">
                <stat.icon size={20} className={stat.color || 'text-foreground'} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50">EMER_V.{i + 1}</span>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-black font-mono">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Broadcasts */}
      {activeBroadcasts.length > 0 && (
        <div className="bg-card border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Megaphone size={18} className="text-red-600" />
              Active Emergency Broadcasts
            </h3>
            <span className="text-[10px] font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              {activeBroadcasts.length} ACTIVE
            </span>
          </div>
          
          <div className="space-y-4">
            {activeBroadcasts.map((broadcast) => (
              <div key={broadcast._id} className="border rounded-2xl p-6 bg-red-50 border-red-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${getTypeColor(broadcast.type)}`}>
                      {createElement(getTypeIcon(broadcast.type), { size: 20 })}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{broadcast.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(broadcast.severity)}`}>
                          {broadcast.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(broadcast.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(broadcast._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Resolve
                  </button>
                </div>
                
                <p className="text-muted-foreground mb-4">{broadcast.message}</p>
                
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-muted-foreground" />
                    <span className="font-medium">Areas:</span>
                    <span>{broadcast.affectedAreas?.join(", ")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-muted-foreground" />
                    <span className="font-medium">Audience:</span>
                    <span>{broadcast.targetAudience?.join(", ")}</span>
                  </div>
                  
                  {broadcast.estimatedDuration && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-muted-foreground" />
                      <span className="font-medium">Duration:</span>
                      <span>{broadcast.estimatedDuration}</span>
                    </div>
                  )}
                </div>
                
                {broadcast.instructions && broadcast.instructions.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-xl border">
                    <h5 className="font-medium mb-2">Instructions:</h5>
                    <ul className="space-y-1">
                      {broadcast.instructions.map((instruction, index) => (
                        <li key={index} className="text-sm text-muted-foreground">• {instruction}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Broadcast Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-opacity font-bold text-lg shadow-lg"
        >
          <Send size={24} />
          Create Emergency Broadcast
        </button>
      </div>

      {/* Broadcast Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Megaphone size={24} className="text-red-600" />
              Create Emergency Broadcast
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Alert Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select alert type</option>
                    {BROADCAST_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Severity Level *</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select severity</option>
                    {SEVERITY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Alert Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Brief, attention-grabbing title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Detailed message explaining the situation"
                  required
                />
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Affected Areas *</label>
                  <input
                    className="sr-only"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.affectedAreas.join(",")}
                    onChange={() => undefined}
                    required
                  />
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-xl p-3">
                    {AREAS.map(area => (
                      <label key={area.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.affectedAreas.includes(area.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, affectedAreas: [...formData.affectedAreas, area.value]})
                            } else {
                              setFormData({...formData, affectedAreas: formData.affectedAreas.filter(a => a !== area.value)})
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{area.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience *</label>
                  <input
                    className="sr-only"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.targetAudience.join(",")}
                    onChange={() => undefined}
                    required
                  />
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-xl p-3">
                    {AUDIENCE_OPTIONS.map(option => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.targetAudience.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, targetAudience: [...formData.targetAudience, option.value]})
                            } else {
                              setFormData({...formData, targetAudience: formData.targetAudience.filter(a => a !== option.value)})
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Channels *</label>
                <input
                  className="sr-only"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.deliveryChannels.join(",")}
                  onChange={() => undefined}
                  required
                />
                <div className="flex flex-wrap gap-3">
                  {DELIVERY_CHANNELS.map(channel => (
                    <label key={channel.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.deliveryChannels.includes(channel.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, deliveryChannels: [...formData.deliveryChannels, channel.value]})
                          } else {
                            setFormData({...formData, deliveryChannels: formData.deliveryChannels.filter(c => c !== channel.value)})
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{channel.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Duration</label>
                <input
                  type="text"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 2 hours, until further notice"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Safety Instructions</label>
                <textarea
                  value={formData.instructions.join("\n")}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value.split("\n").filter(i => i.trim())})}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter each instruction on a new line"
                />
              </div>
              
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border rounded-xl hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send Emergency Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Resolved Broadcasts */}
      {resolvedBroadcasts.length > 0 && (
        <div className="bg-card border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600" />
              Recently Resolved
            </h3>
            <span className="text-[10px] font-mono text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              {resolvedBroadcasts.length} RESOLVED
            </span>
          </div>
          
          <div className="space-y-3">
            {resolvedBroadcasts.slice(0, 5).map((broadcast) => (
              <div key={broadcast._id} className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(broadcast.type)}`}>
                    {createElement(getTypeIcon(broadcast.type), { size: 16 })}
                  </div>
                  <div>
                    <h4 className="font-medium">{broadcast.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Resolved {broadcast.resolvedAt ? new Date(broadcast.resolvedAt).toLocaleString() : "Recently"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(broadcast.severity)}`}>
                    {broadcast.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
