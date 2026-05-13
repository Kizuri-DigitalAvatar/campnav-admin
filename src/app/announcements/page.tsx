"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { LayoutGrid, List, Plus, Trash2, Megaphone, Upload, X, Search, Filter } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnnouncementsPage() {
    const [filterPriority, setFilterPriority] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    const announcements = useQuery(api.announcements.list, { priority: filterPriority })
    const announcementList = announcements ?? []

    const createAnnouncement = useMutation(api.announcements.create)
    const deleteAnnouncement = useMutation(api.announcements.remove)
    const generateUploadUrl = useMutation(api.images.generateUploadUrl)

    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [priority, setPriority] = useState("medium")
    const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
    const [isAdding, setIsAdding] = useState(false)
    const [broadcast, setBroadcast] = useState(false)

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Filter results locally for search query
    const filteredResults = announcementList.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!title.trim() || !content.trim()) return

        setIsUploading(true)
        let coverImage = undefined

        try {
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

            await createAnnouncement({
                title: title.trim(),
                content: content.trim(),
                author: "Admin",
                priority,
                coverImage,
                broadcast,
            })

            setTitle("")
            setContent("")
            setPriority("medium")
            setBroadcast(false)
            setSelectedFile(null)
            setImagePreview(null)
            setIsAdding(false)
        } catch (err) {
            console.error("Failed to create announcement:", err)
            alert("Error creating announcement. Check console.")
        } finally {
            setIsUploading(false)
        }
    }

    async function handleDelete(id: any) {
        if (confirm("Delete this announcement?")) {
            await deleteAnnouncement({ id })
        }
    }

    return (
        <div className="space-y-8 md:space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Updates & Announcements
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="text"
                            placeholder="Search updates..."
                            className="w-full md:w-64 pl-10 h-10 rounded-xl border bg-card focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-card border rounded-xl px-3 h-10">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <select
                            className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                        >
                            <option value="all">ALL PRIORITY</option>
                            <option value="high">HIGH</option>
                            <option value="medium">MEDIUM</option>
                            <option value="low">LOW</option>
                        </select>
                    </div>
                    <div className="bg-card border p-1 rounded-xl flex">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-primary text-primary-foreground h-10 px-4 rounded-xl flex items-center gap-2 font-bold text-xs hover:opacity-90 transition-opacity"
                    >
                        {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{isAdding ? "CANCEL" : "NEW POST"}</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-xl font-bold mb-8">Post a new update</h3>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="md:col-span-1 space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cover Image</label>
                                <div className="h-48 bg-muted rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden group relative hover:border-primary transition-all">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                                                className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-8 h-8" />
                                            </button>
                                        </>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center p-4 text-center">
                                            <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                                            <span className="text-[10px] text-muted-foreground font-black uppercase">Upload Cover</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</label>
                                        <input
                                            className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                            placeholder="Maintenance Update..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Priority</label>
                                        <select
                                            className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Content</label>
                                    <textarea
                                        className="w-full min-h-[140px] p-4 rounded-xl border bg-muted/50 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none leading-relaxed"
                                        placeholder="Details of the update..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t font-bold">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${broadcast ? 'bg-primary border-primary' : 'bg-muted border-border group-hover:border-primary/50'}`}>
                                    {broadcast && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={broadcast} 
                                    onChange={(e) => setBroadcast(e.target.checked)} 
                                />
                                <span className="text-xs uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Broadcast to all campers</span>
                            </label>
                            
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="bg-muted text-foreground px-8 h-12 rounded-xl hover:bg-muted/80 transition-all"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="bg-primary text-primary-foreground px-12 h-12 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {isUploading ? "PUBLISHING..." : "PUBLISH POST"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {announcements === undefined ? (
                viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] rounded-3xl" />)}
                    </div>
                ) : (
                    <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                        </div>
                    </div>
                )
            ) : (
                viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredResults.map((a: any) => (
                        <div key={a._id} className="bg-card border rounded-3xl flex flex-col group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                            {a.coverImageUrl ? (
                                <div className="h-44 overflow-hidden relative">
                                    <img src={a.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                            ) : (
                                <div className="h-44 flex items-center justify-center bg-muted">
                                    <Megaphone className="w-12 h-12 opacity-5" />
                                </div>
                            )}

                            <div className="p-8 flex-grow flex flex-col">
                                <div className="flex justify-between items-start mb-5">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${a.priority === 'high' ? 'bg-destructive text-destructive-foreground border-destructive' :
                                            a.priority === 'medium' ? 'bg-primary/10 text-primary border-primary/20' :
                                                'bg-muted text-muted-foreground border-border'
                                        }`}>
                                        {a.priority}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-bold tracking-tight">
                                        {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>

                                <h4 className="text-xl font-bold mb-3 tracking-tight leading-tight">{a.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-8 flex-grow leading-relaxed">{a.content}</p>

                                <div className="flex justify-between items-center pt-5 border-t">
                                    <span className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">By {a.author}</span>
                                    <button
                                        onClick={() => handleDelete(a._id)}
                                        className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left table-fixed">
                        <thead className="bg-muted/50 border-b text-muted-foreground uppercase text-[10px] tracking-widest font-black">
                            <tr>
                                <th className="p-5 w-1/2">Update Information</th>
                                <th className="p-5 w-40">Priority</th>
                                <th className="p-5 w-40">Date</th>
                                <th className="p-5 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredResults.map((a: any) => (
                                <tr key={a._id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center space-x-4">
                                            {a.coverImageUrl && (
                                                <img src={a.coverImageUrl} className="w-12 h-12 rounded-xl object-cover border" alt="" />
                                            )}
                                            <div className="truncate">
                                                <div className="font-bold text-foreground text-sm">{a.title}</div>
                                                <div className="text-xs text-muted-foreground truncate">{a.content}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${a.priority === 'high' ? 'text-destructive' :
                                                a.priority === 'medium' ? 'text-primary' :
                                                    'text-muted-foreground'
                                            }`}>
                                            {a.priority}
                                        </span>
                                    </td>
                                    <td className="p-5 text-[11px] text-muted-foreground font-bold italic">
                                        {new Date(a.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-5 text-right">
                                        <button
                                            onClick={() => handleDelete(a._id)}
                                            className="p-2 rounded-xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            {announcements !== undefined && filteredResults.length === 0 && (
                <div className="p-24 text-center bg-muted/20 border-2 border-dashed rounded-3xl">
                    <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase italic">No updates published</p>
                </div>
            )}
        </div>
    )
}
