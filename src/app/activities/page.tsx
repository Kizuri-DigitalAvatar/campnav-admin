"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Plus,
    Calendar as CalendarIcon,
    MapPin,
    Clock,
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
    const updateActivity = useMutation(api.activities.update)
    const generateUploadUrl = useMutation(api.images.generateUploadUrl)

    const [isAdding, setIsAdding] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editSubmitting, setEditSubmitting] = useState(false)
    const [editFile, setEditFile] = useState<File | null>(null)
    const [editPreview, setEditPreview] = useState<string | null>(null)
    const [editCoverImageId, setEditCoverImageId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        category: "Social",
        capacity: ""
    })
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        category: "Social",
        capacity: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            let coverImage: string | undefined = undefined

            if (selectedFile) {
                const postUrl = await generateUploadUrl()
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                })
                const { storageId } = await result.json()
                coverImage = storageId
            }

            await createActivity({
                title: formData.title,
                description: formData.description,
                date: new Date(formData.date).getTime(),
                time: formData.time,
                location: formData.location,
                category: formData.category,
                capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
                coverImage,
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
            setSelectedFile(null)
            setImagePreview(null)
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

    const startEditing = (activity: any) => {
        setEditingId(activity._id)
        setEditForm({
            title: activity.title,
            description: activity.description,
            date: new Date(activity.date).toISOString().split("T")[0],
            time: activity.time,
            location: activity.location,
            category: activity.category || "Social",
            capacity: activity.capacity ? String(activity.capacity) : "",
        })
        setEditPreview(activity.coverImageUrl || null)
        setEditCoverImageId(activity.coverImage || null)
        setEditFile(null)
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditForm({
            title: "",
            description: "",
            date: "",
            time: "",
            location: "",
            category: "Social",
            capacity: "",
        })
        setEditFile(null)
        setEditPreview(null)
        setEditCoverImageId(null)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingId) return
        setEditSubmitting(true)
        try {
            let coverImage: string | undefined = editCoverImageId || undefined

            if (editFile) {
                const postUrl = await generateUploadUrl()
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": editFile.type },
                    body: editFile,
                })
                const { storageId } = await result.json()
                coverImage = storageId
            }

            await updateActivity({
                id: editingId as any,
                title: editForm.title,
                description: editForm.description,
                date: new Date(editForm.date).getTime(),
                time: editForm.time,
                location: editForm.location,
                category: editForm.category,
                capacity: editForm.capacity ? parseInt(editForm.capacity) : undefined,
                coverImage,
            })
            toast.success("Activity updated")
            cancelEditing()
        } catch (error) {
            toast.error("Failed to update activity")
        } finally {
            setEditSubmitting(false)
        }
    }

    return (
        <div className="space-y-8 md:space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage upcoming camp events and schedules</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-primary text-primary-foreground h-11 px-6 rounded-xl flex items-center gap-2 font-bold text-xs hover:opacity-90 transition-opacity"
                >
                    {isAdding ? "CANCEL" : <><Plus size={16} /> ADD ACTIVITY</>}
                </button>
            </div>

            {isAdding && (
                <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Morning Yoga"
                                    className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What's happening?"
                                    className="w-full min-h-[120px] p-4 rounded-xl border bg-muted/50 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none leading-relaxed"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Time</label>
                                    <input
                                        required
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        required
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g. Lake Side"
                                        className="w-full h-11 rounded-xl border bg-muted/50 pl-10 pr-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cover Image</label>
                                <div className="flex items-center gap-3">
                                    <label
                                        htmlFor="activity-cover"
                                        className="h-11 px-4 rounded-xl border bg-muted/50 text-sm font-semibold cursor-pointer hover:bg-muted transition-colors inline-flex items-center justify-center"
                                    >
                                        {selectedFile ? "Change Image" : "Upload Image"}
                                    </label>
                                    <input
                                        id="activity-cover"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null
                                            setSelectedFile(file)
                                            setImagePreview(file ? URL.createObjectURL(file) : null)
                                        }}
                                    />
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            className="text-xs text-destructive font-semibold underline"
                                            onClick={() => {
                                                setSelectedFile(null)
                                                setImagePreview(null)
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                {imagePreview && (
                                    <div className="mt-2 rounded-xl overflow-hidden border bg-muted/30">
                                        <img src={imagePreview} alt="Cover preview" className="w-full h-40 object-cover" />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                    >
                                        <option value="Social">Social</option>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Outdoor">Outdoor</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Capacity</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                            placeholder="Optional"
                                            className="w-full h-11 rounded-xl border bg-muted/50 pl-10 pr-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6">
                                <button
                                    disabled={submitting}
                                    className="w-full bg-primary text-primary-foreground rounded-xl h-14 font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {submitting ? "PROCESSING..." : "SAVE ACTIVITY"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activities === undefined ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] rounded-3xl" />)
                ) : activities.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                        <CalendarIcon className="mx-auto h-16 w-16 opacity-5 mb-4" />
                        <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase italic">Schedule Empty</p>
                    </div>
                ) : (
                    activities.map((activity: any) => {
                        const isEditing = editingId === activity._id
                        return (
                            <div key={activity._id} className="bg-card border rounded-3xl p-8 group hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${activity.category === 'Outdoor' ? 'bg-primary text-primary-foreground border-primary' :
                                            activity.category === 'Workshop' ? 'bg-background text-foreground border-border shadow-sm' :
                                                'bg-muted text-muted-foreground border-border'
                                        }`}>
                                        {activity.category}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEditing(activity)}
                                            className="p-2.5 rounded-xl border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(activity._id)}
                                            className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <form
                                        onSubmit={handleEditSubmit}
                                        className="flex flex-col gap-5 rounded-2xl border border-border bg-background p-5 text-foreground shadow-sm"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</label>
                                            <Input
                                                required
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                className="h-11 font-semibold bg-background text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary/20"
                                                placeholder="Update title"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                                            <Textarea
                                                required
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                placeholder="Add more context"
                                                className="min-h-[120px] bg-background text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date</label>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        required
                                                        type="date"
                                                        value={editForm.date}
                                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                        className="pl-9 bg-background text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Time</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        required
                                                        type="time"
                                                        value={editForm.time}
                                                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                                        className="pl-9 bg-background text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    required
                                                    value={editForm.location}
                                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                    placeholder="Where is it happening?"
                                                    className="pl-9 bg-background text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                                                <select
                                                    value={editForm.category}
                                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                    className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                                                >
                                                    <option value="Social">Social</option>
                                                    <option value="Workshop">Workshop</option>
                                                    <option value="Outdoor">Outdoor</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Capacity</label>
                                                <div className="relative">
                                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        value={editForm.capacity}
                                                        onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                                                        placeholder="Optional"
                                                        className="pl-9 bg-background text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cover Image</label>
                                                <span className="text-[11px] text-muted-foreground">Recommended 1200x500</span>
                                            </div>
                                            <div className="rounded-xl border border-dashed border-border bg-background/60 p-3">
                                                <div className="flex items-center gap-3">
                                                    <label
                                                        htmlFor={`edit-cover-${activity._id}`}
                                                        className="h-10 px-4 rounded-lg border border-border bg-muted/60 text-xs font-semibold cursor-pointer hover:bg-muted transition-colors inline-flex items-center justify-center text-foreground"
                                                    >
                                                        {editFile ? "Change Image" : "Upload Image"}
                                                    </label>
                                                    {(editPreview || editCoverImageId) && (
                                                        <button
                                                            type="button"
                                                            className="text-xs text-destructive font-semibold underline"
                                                            onClick={() => {
                                                                setEditFile(null)
                                                                setEditPreview(null)
                                                                setEditCoverImageId(null)
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                    <input
                                                        id={`edit-cover-${activity._id}`}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0] || null
                                                            setEditFile(file)
                                                            setEditPreview(file ? URL.createObjectURL(file) : editPreview)
                                                            if (file) setEditCoverImageId(null)
                                                        }}
                                                    />
                                                </div>
                                                {(editPreview || activity.coverImageUrl) && (
                                                    <div className="mt-3 overflow-hidden rounded-lg border border-border bg-muted/20">
                                                        <img
                                                            src={editPreview || activity.coverImageUrl}
                                                            alt="Cover preview"
                                                            className="w-full h-36 object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={cancelEditing}
                                                disabled={editSubmitting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button className="flex-1" disabled={editSubmitting}>
                                                {editSubmitting ? (
                                                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving</span>
                                                ) : "Save Changes"}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex-grow">
                                            <h3 className="text-xl font-bold tracking-tight mb-2 underline decoration-primary/20 decoration-2 underline-offset-4">
                                                {activity.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                {activity.description}
                                            </p>
                                        </div>

                                        {activity.coverImageUrl && (
                                            <div className="mb-4 overflow-hidden rounded-2xl border bg-muted/40">
                                                <img src={activity.coverImageUrl} alt={activity.title} className="w-full h-44 object-cover" />
                                            </div>
                                        )}

                                        <div className="mt-4 pt-6 border-t space-y-3">
                                            <div className="flex items-center text-xs font-bold text-muted-foreground">
                                                <div className="p-1.5 rounded-lg bg-muted mr-3">
                                                    <CalendarIcon size={12} className="text-foreground" />
                                                </div>
                                                {new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at <span className="text-foreground ml-1">{activity.time}</span>
                                            </div>
                                            <div className="flex items-center text-xs font-bold text-muted-foreground">
                                                <div className="p-1.5 rounded-lg bg-muted mr-3">
                                                    <MapPin size={12} className="text-foreground" />
                                                </div>
                                                {activity.location}
                                            </div>
                                            {activity.capacity && (
                                                <div className="flex items-center text-xs font-bold text-muted-foreground">
                                                    <div className="p-1.5 rounded-lg bg-muted mr-3">
                                                        <Users size={12} className="text-foreground" />
                                                    </div>
                                                    Capacity: <span className="text-foreground ml-1">{activity.capacity} persons</span>
                                                </div>
                                            )}
                                            <div className="flex items-start gap-3 text-xs font-bold text-muted-foreground">
                                                <div className="p-1.5 rounded-lg bg-muted mr-1">
                                                    <Megaphone size={12} className="text-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Interested</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {activity.interestedCount || 0} member{(activity.interestedCount || 0) === 1 ? "" : "s"}
                                                    </p>
                                                    {activity.interested && activity.interested.length > 0 && (
                                                        <ul className="mt-1 space-y-1 text-[11px] text-foreground/80">
                                                            {activity.interested.map((i: any) => (
                                                                <li key={i._id} className="flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                    {i.userId}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
