"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { LayoutGrid, List, Plus, Trash2, Megaphone, Upload, X, Search, Filter } from "lucide-react"

export default function AnnouncementsPage() {
    const [filterPriority, setFilterPriority] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    const announcements = useQuery(api.announcements.list, { priority: filterPriority }) ?? []

    const createAnnouncement = useMutation(api.announcements.create)
    const deleteAnnouncement = useMutation(api.announcements.remove)
    const generateUploadUrl = useMutation(api.images.generateUploadUrl)

    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [priority, setPriority] = useState("medium")
    const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
    const [isAdding, setIsAdding] = useState(false)

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Filter results locally for search query
    const filteredResults = announcements.filter(a =>
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
            })

            setTitle("")
            setContent("")
            setPriority("medium")
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
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Megaphone className="w-8 h-8 text-indigo-400" />
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
                        Updates
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search updates..."
                            className="glass-input pl-10 w-64 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center glass-card px-3 py-1.5 space-x-2">
                        <Filter className="w-4 h-4 text-white/20" />
                        <select
                            className="bg-transparent text-xs text-white/60 outline-none cursor-pointer"
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                        >
                            <option value="all" className="bg-slate-900">All Priority</option>
                            <option value="high" className="bg-slate-900">High</option>
                            <option value="medium" className="bg-slate-900">Medium</option>
                            <option value="low" className="bg-slate-900">Low</option>
                        </select>
                    </div>
                    <div className="bg-white/5 p-1 rounded-lg border border-white/10 flex">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="glass-button bg-indigo-600/50 hover:bg-indigo-600/70 text-white flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Post</span>
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="glass-card p-6 border-indigo-500/30">
                    <h3 className="text-xl font-semibold mb-4 text-blue-100 italic">Post a new update</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-2">
                                <label className="text-sm text-blue-200/60 ml-1">Cover Image</label>
                                <div className="h-40 glass-card flex items-center justify-center overflow-hidden group relative border-2 border-dashed border-white/10 hover:border-indigo-500/50 transition-all">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-8 h-8 text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center p-4 text-center">
                                            <Upload className="w-8 h-8 text-white/10 mb-2" />
                                            <span className="text-xs text-white/20 font-bold uppercase tracking-widest">Upload Cover</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-blue-200/60 ml-1">Title</label>
                                        <input
                                            className="glass-input w-full"
                                            placeholder="Maintenance Update..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-blue-200/60 ml-1">Priority</label>
                                        <select
                                            className="glass-input w-full bg-indigo-950/40"
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
                                    <label className="text-sm text-blue-200/60 ml-1">Content</label>
                                    <textarea
                                        className="glass-input w-full min-h-[100px] resize-none"
                                        placeholder="Details of the update..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="glass-button bg-white/5 hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUploading}
                                className="glass-button bg-blue-600/50 hover:bg-blue-600/70 text-white px-8 disabled:opacity-50"
                            >
                                {isUploading ? "Uploading..." : "Publish Post"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResults.map((a: any) => (
                        <div key={a._id} className="glass-card flex flex-col group relative overflow-hidden bg-white/[0.02]">
                            {a.coverImageUrl ? (
                                <div className="h-40 overflow-hidden relative">
                                    <img src={a.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                </div>
                            ) : (
                                <div className={`h-40 flex items-center justify-center ${a.priority === 'high' ? 'bg-red-500/5' : a.priority === 'medium' ? 'bg-amber-500/5' : 'bg-blue-500/5'
                                    }`}>
                                    <Megaphone className="w-12 h-12 text-white/5" />
                                </div>
                            )}

                            <div className="p-6 flex-grow flex flex-col relative">
                                <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 ${a.priority === 'high' ? 'bg-red-500/20' : a.priority === 'medium' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                                    }`} />

                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${a.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        a.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                        {a.priority}
                                    </span>
                                    <span className="text-[10px] text-white/30 font-mono italic">
                                        {new Date(a.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <h4 className="text-lg font-bold text-blue-50 mb-2 truncate">{a.title}</h4>
                                <p className="text-sm text-blue-200/60 line-clamp-3 mb-6 flex-grow leading-relaxed">{a.content}</p>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <span className="text-[10px] text-white/20 italic tracking-wide">By {a.author}</span>
                                    <button
                                        onClick={() => handleDelete(a._id)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-blue-200/80 uppercase text-[10px] tracking-widest font-bold">
                            <tr>
                                <th className="p-4">Update</th>
                                <th className="p-4">Priority</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {filteredResults.map((a: any) => (
                                <tr key={a._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            {a.coverImageUrl && (
                                                <img src={a.coverImageUrl} className="w-10 h-10 rounded object-cover border border-white/10" alt="" />
                                            )}
                                            <div>
                                                <div className="font-medium text-blue-50">{a.title}</div>
                                                <div className="text-xs text-blue-200/40 truncate max-w-[400px]">{a.content}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.priority === 'high' ? 'text-red-400' : a.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'
                                            }`}>
                                            {a.priority}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-white/30 font-mono">
                                        {new Date(a.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDelete(a._id)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/0 group-hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredResults.length === 0 && (
                <div className="p-12 text-center text-white/10 italic">
                    No updates found matching your filters.
                </div>
            )}


        </div>
    )
}
