"use client"

"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Plus,
    Calendar as CalendarIcon,
    MapPin,
    Clock,
    Tag,
    Users,
    Trash2,
    Edit2,
    Loader2,
    Megaphone
} from "lucide-react"
import { toast } from "sonner"

export default function ActivitiesPage() {
    const activities = useQuery(api.activities.list)
    const createActivity = useMutation(api.activities.create)
    const removeActivity = useMutation(api.activities.remove)

    const [isAdding, setIsAdding] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        category: "Social",
        capacity: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await createActivity({
                title: formData.title,
                description: formData.description,
                date: new Date(formData.date).getTime(),
                time: formData.time,
                location: formData.location,
                category: formData.category,
                capacity: formData.capacity ? parseInt(formData.capacity) : undefined
            })
            toast.success("Activity created successfully")
            setIsAdding(false)
            setFormData({
                title: "",
                description: "",
                date: "",
                time: "",
                location: "",
                category: "Social",
                capacity: ""
            })
        } catch (error) {
            toast.error("Failed to create activity")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: any) => {
        if (!confirm("Are you sure you want to delete this activity?")) return
        try {
            await removeActivity({ id })
            toast.success("Activity deleted")
        } catch (error) {
            toast.error("Failed to delete activity")
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Activities
                    </h1>
                    <p className="text-blue-200/60 mt-1">Manage upcoming camp events and schedules</p>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6"
                >
                    {isAdding ? "Cancel" : <><Plus size={18} className="mr-2" /> Add Activity</>}
                </Button>
            </div>

            {isAdding && (
                <Card className="glass-card border-white/10 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-blue-200/60 uppercase ml-1">Title</label>
                                <Input
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Morning Yoga"
                                    className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-200/60 uppercase ml-1">Description</label>
                                <Textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What's happening?"
                                    className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500 h-24"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-blue-200/60 uppercase ml-1">Date</label>
                                    <Input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-blue-200/60 uppercase ml-1">Time</label>
                                    <Input
                                        required
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-blue-200/60 uppercase ml-1">Location</label>
                                <Input
                                    required
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Lake Side"
                                    className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-blue-200/60 uppercase ml-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500 h-10 px-3 text-sm outline-none"
                                    >
                                        <option value="Social" className="bg-slate-900 text-white">Social</option>
                                        <option value="Workshop" className="bg-slate-900 text-white">Workshop</option>
                                        <option value="Outdoor" className="bg-slate-900 text-white">Outdoor</option>
                                        <option value="Other" className="bg-slate-900 text-white">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-blue-200/60 uppercase ml-1">Max Capacity</label>
                                    <Input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        placeholder="Optional"
                                        className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <Button
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-6"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : "Save Activity"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities === undefined ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 glass-card border-white/10 animate-pulse" />)
                ) : activities.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-card border-white/10 border-dashed border-2">
                        <CalendarIcon className="mx-auto h-12 w-12 text-white/10 mb-4" />
                        <p className="text-blue-200/40">No activities scheduled yet</p>
                    </div>
                ) : (
                    activities.map((activity: any) => (
                        <Card key={activity._id} className="glass-card border-white/10 p-5 group hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                        {activity.category}
                                    </div>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(activity._id)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-white/60 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
                                        {activity.title}
                                    </h3>
                                    <p className="text-sm text-blue-200/60 line-clamp-2 mt-1">
                                        {activity.description}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                                <div className="flex items-center text-xs text-blue-200/40">
                                    <CalendarIcon size={14} className="mr-2 text-indigo-400" />
                                    {new Date(activity.date).toLocaleDateString()} at {activity.time}
                                </div>
                                <div className="flex items-center text-xs text-blue-200/40">
                                    <MapPin size={14} className="mr-2 text-indigo-400" />
                                    {activity.location}
                                </div>
                                {activity.capacity && (
                                    <div className="flex items-center text-xs text-blue-200/40">
                                        <Users size={14} className="mr-2 text-indigo-400" />
                                        Capacity: {activity.capacity} persons
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
