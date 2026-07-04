"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "../../../../convex/_generated/api"
import { 
  Wrench, Calendar, CheckCircle2, AlertCircle, Plus, 
  Settings, Droplets, Wind, ClipboardCheck, Trash2
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const SERVICE_TYPES = [
  { id: "grease_service", label: "Grease Service", icon: Droplets, color: "text-amber-500" },
  { id: "fumigation", label: "Fumigation", icon: Settings, color: "text-purple-500" },
  { id: "ac_service", label: "AC Service", icon: Wind, color: "text-blue-500" },
  { id: "general", label: "General", icon: Wrench, color: "text-gray-500" },
]

export default function PreventiveMaintenancePage() {
  const items = useQuery(api.preventive.list) ?? []
  const createItem = useMutation(api.preventive.create)
  const updateStatus = useMutation(api.preventive.updateStatus)

  const [title, setTitle] = useState("")
  const [type, setType] = useState("ac_service")
  const [frequency, setFrequency] = useState("monthly")
  const [nextDue, setNextDue] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !nextDue) return
    
    await createItem({
      title,
      type,
      frequency,
      nextDue: new Date(nextDue).getTime(),
      checklist: [{ item: "Standard Inspection", completed: false }],
    })
    
    setTitle("")
    setNextDue("")
    setShowAdd(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "overdue": return "bg-red-500/10 text-red-600 border-red-500/20"
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      default: return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Preventive Maintenance</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and schedule recurring maintenance tasks</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {showAdd ? "CANCEL" : "SCHEDULE TASK"}
        </button>
      </header>

      {showAdd && (
        <Card className="p-6 border-2 border-primary/20 bg-primary/5 rounded-3xl animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Task Title</label>
              <Input 
                placeholder="e.g. Monthly AC Filter Clean" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 rounded-xl bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type</label>
              <select 
                className="w-full h-11 rounded-xl border bg-background px-4 text-sm outline-none"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {SERVICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frequency</label>
              <select 
                className="w-full h-11 rounded-xl border bg-background px-4 text-sm outline-none"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Next Due Date</label>
              <Input 
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className="h-11 rounded-xl bg-background"
                required
              />
            </div>
            <div className="md:col-start-4">
              <button type="submit" className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-lg">
                SAVE SCHEDULE
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const typeInfo = SERVICE_TYPES.find(t => t.id === item.type) || SERVICE_TYPES[3]
          const isOverdue = item.nextDue < Date.now() && item.status !== "completed"
          
          return (
            <Card key={item._id} className="overflow-hidden rounded-3xl border bg-card hover:shadow-lg transition-all group">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-2xl bg-muted/50 ${typeInfo.color}`}>
                    <typeInfo.icon className="w-6 h-6" />
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(isOverdue ? 'overdue' : item.status)}`}>
                    {isOverdue ? 'OVERDUE' : item.status}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.frequency}</p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Next Due:</span>
                    </div>
                    <span className={`font-bold ${isOverdue ? 'text-red-500' : 'text-foreground'}`}>
                      {new Date(item.nextDue).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Last Done:</span>
                    </div>
                    <span className="font-bold">
                      {item.lastCompleted ? new Date(item.lastCompleted).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>

                {item.status !== "completed" && (
                  <button 
                    onClick={() => updateStatus({ id: item._id, status: "completed" })}
                    className="w-full mt-4 py-2.5 rounded-xl border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                  >
                    MARK COMPLETED
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {items.length === 0 && !showAdd && (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/10">
          <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-bold tracking-widest uppercase text-sm italic">No maintenance tasks scheduled</p>
          <button 
            onClick={() => setShowAdd(true)}
            className="mt-4 text-primary font-black text-xs uppercase tracking-widest hover:underline"
          >
            Create your first schedule →
          </button>
        </div>
      )}
    </div>
  )
}
