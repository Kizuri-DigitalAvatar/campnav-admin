"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { AlertTriangle, Plus, Search, Filter, Download, Eye, Edit, CheckCircle, XCircle, Clock, MapPin, User, Calendar, FileText, Camera } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

interface IncidentFormData {
  type: string
  severity: string
  location: string
  category: string
  description: string
  immediateAction: string
  images: string[]
}

const INCIDENT_TYPES = [
  { value: "injury", label: "Injury" },
  { value: "near_miss", label: "Near Miss" },
  { value: "property_damage", label: "Property Damage" },
  { value: "environmental", label: "Environmental" },
]

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "text-green-600 bg-green-100" },
  { value: "medium", label: "Medium", color: "text-yellow-600 bg-yellow-100" },
  { value: "high", label: "High", color: "text-orange-600 bg-orange-100" },
  { value: "critical", label: "Critical", color: "text-red-600 bg-red-100" },
]

const LOCATIONS = [
  { value: "camp", label: "Camp" },
  { value: "site", label: "Site" },
  { value: "vehicle", label: "Vehicle" },
  { value: "office", label: "Office" },
]

const CATEGORIES = [
  { value: "slip_trip_fall", label: "Slip/Trip/Fall" },
  { value: "equipment", label: "Equipment" },
  { value: "vehicle", label: "Vehicle" },
  { value: "fire", label: "Fire" },
  { value: "chemical", label: "Chemical" },
  { value: "other", label: "Other" },
]

export default function IncidentManagement() {
  const incidents = useQuery(api.safety.getIncidents, {}) || []
  const createIncident = useMutation(api.safety.createIncident)
  const updateIncident = useMutation(api.safety.updateIncident)
  
  const [showForm, setShowForm] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Id<"safetyIncidents"> | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  
  const [formData, setFormData] = useState<IncidentFormData>({
    type: "",
    severity: "",
    location: "",
    category: "",
    description: "",
    immediateAction: "",
    images: [],
  })

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = !filterSeverity || incident.severity === filterSeverity
    const matchesStatus = !filterStatus || incident.status === filterStatus
    const matchesLocation = !filterLocation || incident.location === filterLocation
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesLocation
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingIncident) {
        await updateIncident({
          id: editingIncident,
          status: "open", // Keep as open when editing
        })
      } else {
        await createIncident({
          type: formData.type,
          severity: formData.severity,
          location: formData.location,
          category: formData.category,
          description: formData.description,
          immediateAction: formData.immediateAction,
          images: formData.images,
        })
      }
      
      // Reset form
      setFormData({
        type: "",
        severity: "",
        location: "",
        category: "",
        description: "",
        immediateAction: "",
        images: [],
      })
      setShowForm(false)
      setEditingIncident(null)
    } catch (error) {
      console.error("Error saving incident:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    const level = SEVERITY_LEVELS.find(l => l.value === severity)
    return level ? level.color : "text-gray-600 bg-gray-100"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle size={16} className="text-green-600" />
      case "investigating":
        return <Clock size={16} className="text-yellow-600" />
      default:
        return <AlertTriangle size={16} className="text-red-600" />
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">
          Incident Management
        </h2>
        <p className="text-muted-foreground mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Safety Incident Reporting & Tracking</p>
      </header>

      {/* Stats Overview */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Incidents', value: incidents.length, icon: AlertTriangle },
          { label: 'Open Cases', value: incidents.filter(i => i.status === "open").length, icon: Clock },
          { label: 'Critical', value: incidents.filter(i => i.severity === "critical").length, icon: XCircle },
          { label: 'Resolved', value: incidents.filter(i => i.status === "resolved" || i.status === "closed").length, icon: CheckCircle },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-muted flex items-center justify-center">
                <stat.icon size={20} className="text-foreground" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50">INC_V.{i + 1}</span>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-black font-mono">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="bg-card border rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Severities</option>
              {SEVERITY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map(location => (
                <option key={location.value} value={location.value}>{location.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition-colors">
              <Download size={16} />
              Export
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Report Incident
            </button>
          </div>
        </div>
      </div>

      {/* Incident Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Report New Incident</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Incident Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select type</option>
                    {INCIDENT_TYPES.map(type => (
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
                
                <div>
                  <label className="block text-sm font-medium mb-2">Location *</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select location</option>
                    {LOCATIONS.map(location => (
                      <option key={location.value} value={location.value}>{location.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Detailed description of the incident..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Immediate Action Taken</label>
                <textarea
                  value={formData.immediateAction}
                  onChange={(e) => setFormData({...formData, immediateAction: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Any immediate actions taken..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Attach Images</label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center">
                  <Camera size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload images or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 10MB</p>
                </div>
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
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incidents List */}
      <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold">Recent Incidents</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Severity</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reported</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No incidents found
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident._id} className="border-b border-border hover:bg-muted/20">
                    <td className="py-3 px-4 text-sm font-mono">
                      #{incident._id.toString().slice(-6)}
                    </td>
                    <td className="py-3 px-4 text-sm capitalize">
                      {incident.type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm capitalize">
                      {incident.location}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                      {incident.description}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(incident.status)}
                        <span className="text-sm capitalize">{incident.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(incident.reportedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-muted rounded">
                          <Eye size={16} />
                        </button>
                        <button className="p-1 hover:bg-muted rounded">
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
