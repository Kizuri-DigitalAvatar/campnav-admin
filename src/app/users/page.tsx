"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../campnav-client/convex/_generated/api"

import { Upload, X, Trash2, Search, Filter, UserCog } from "lucide-react"

export default function UsersPage() {
  const [filterRole, setFilterRole] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const users = useQuery(api.users.list, { role: filterRole }) ?? []

  const upsertUser = useMutation(api.users.upsert)
  const deleteUser = useMutation(api.users.deleteUser)
  const generateUploadUrl = useMutation(api.images.generateUploadUrl)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [image, setImage] = useState("") // storageId or old url
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [role, setRole] = useState("visitor")
  const [durationStart, setDurationStart] = useState("")
  const [durationEnd, setDurationEnd] = useState("")
  const [isOnSite, setIsOnSite] = useState(false)
  const [campStaffId, setCampStaffId] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const filteredResults = users.filter((u: any) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
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
    if (!name.trim() || !email.trim()) return

    setIsUploading(true)
    let finalImage = image

    try {
      if (selectedFile) {
        const postUrl = await generateUploadUrl()
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        })
        const { storageId } = await result.json()
        finalImage = storageId
      }

      await upsertUser({
        name: name.trim(),
        email: email.trim(),
        image: finalImage.trim() || undefined,
        password: password.trim() || undefined,
        role,
        durationStart: durationStart ? new Date(durationStart).getTime() : undefined,
        durationEnd: durationEnd ? new Date(durationEnd).getTime() : undefined,
        isOnSite: role === 'staff' ? isOnSite : undefined,
        campStaffId: role === 'staff' ? campStaffId.trim() : undefined,
      })
      resetForm()
    } catch (err) {
      console.error("Failed to upsert user:", err)
      alert("Error saving user. Check console.")
    } finally {
      setIsUploading(false)
    }
  }

  function resetForm() {
    setName("")
    setEmail("")
    setPassword("")
    setImage("")
    setSelectedFile(null)
    setImagePreview(null)
    setRole("visitor")
    setDurationStart("")
    setDurationEnd("")
    setIsOnSite(false)
    setCampStaffId("")
    setEditingId(null)
  }

  function handleEdit(user: any) {
    setName(user.name)
    setEmail(user.email)
    setPassword(user.password || "")
    setImage(user.image || "")
    setImagePreview(user.imageUrl || null)
    setRole(user.role || "visitor")
    setDurationStart(user.durationStart ? new Date(user.durationStart).toISOString().split('T')[0] : "")
    setDurationEnd(user.durationEnd ? new Date(user.durationEnd).toISOString().split('T')[0] : "")
    setIsOnSite(user.isOnSite || false)
    setCampStaffId(user.campStaffId || "")
    setEditingId(user._id)
  }

  async function handleDelete(id: any) {
    if (confirm("Are you sure you want to delete this user?")) {
      await deleteUser({ id })
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <UserCog className="w-8 h-8 text-indigo-400" />
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
            User Management
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search users..."
              className="glass-input pl-10 w-64 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center glass-card px-3 py-1.5 space-x-2">
            <Filter className="w-4 h-4 text-white/20" />
            <select
              className="bg-transparent text-xs text-white/60 outline-none cursor-pointer"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all" className="bg-slate-900">All Roles</option>
              <option value="admin" className="bg-slate-900">Admin</option>
              <option value="staff" className="bg-slate-900">Staff</option>
              <option value="housekeeper" className="bg-slate-900">Housekeeper</option>
              <option value="visitor" className="bg-slate-900">Visitor</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 border-indigo-500/30">
        <h3 className="text-xl font-semibold mb-4 text-blue-100 italic">
          {editingId ? "Edit User Account" : "Register New Account"}
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-blue-200/60 ml-1">Profile Photo</label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden group relative transition-all hover:border-indigo-400">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setImagePreview(null); setImage(""); }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-6 h-6 text-white" />
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-6 h-6 text-white/20" />
                      <span className="text-[10px] text-white/20 mt-1 uppercase font-bold">Upload</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
                <div className="text-[10px] text-white/20 space-y-1">
                  <p>PNG, JPG up to 5MB</p>
                  <p>Recommended: 200x200</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-blue-200/60 ml-1">Name</label>
              <input
                className="glass-input w-full"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-blue-200/60 ml-1">Email</label>
              <input
                className="glass-input w-full"
                placeholder="john@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-blue-200/60 ml-1">Password</label>
              <input
                className="glass-input w-full"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-blue-200/60 ml-1">Role</label>
              <select
                className="glass-input w-full bg-indigo-950/40"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="housekeeper">Housekeeper</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {role === 'staff' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-blue-200/60 ml-1">CampStaff ID</label>
                  <input
                    className="glass-input w-full"
                    placeholder="STF-001"
                    value={campStaffId}
                    onChange={(e) => setCampStaffId(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-3 h-full pt-1 px-2">
                  <input
                    type="checkbox"
                    id="isOnSite"
                    className="w-4 h-4 rounded bg-white/10 border-white/20"
                    checked={isOnSite}
                    onChange={(e) => setIsOnSite(e.target.checked)}
                  />
                  <label htmlFor="isOnSite" className="text-sm text-blue-200/80 cursor-pointer">
                    Is On Site?
                  </label>
                </div>
              </>
            )}

            {role === 'visitor' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-blue-200/60 ml-1">Stay Start Date</label>
                  <input
                    className="glass-input w-full"
                    type="date"
                    value={durationStart}
                    onChange={(e) => setDurationStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-blue-200/60 ml-1">Stay End Date</label>
                  <input
                    className="glass-input w-full"
                    type="date"
                    value={durationEnd}
                    onChange={(e) => setDurationEnd(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-3 flex gap-2 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={isUploading}
              className="glass-button bg-blue-600/50 hover:bg-blue-600/70 border-blue-500/30 text-white min-w-[140px] disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : (editingId ? "Save Changes" : "Create User")}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="glass-button bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-blue-200/80 uppercase text-[10px] tracking-widest font-bold font-mono">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4 text-center">Role</th>
                <th className="p-4">Staff Meta</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredResults.map((u: any) => (
                <tr key={u._id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-white/20 overflow-hidden flex-shrink-0 shadow-inner">
                        {u.imageUrl ? (
                          <img src={u.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-bold">
                            {u.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-blue-50 tracking-wide">{u.name}</div>
                        <div className="text-[10px] text-blue-200/40 font-mono italic">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${u.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      u.role === 'staff' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        u.role === 'housekeeper' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.role === 'staff' ? (
                      <div className="space-y-1">
                        <div className="text-xs font-mono text-white/40">{u.campStaffId || 'N/A'}</div>
                        <div className={`text-[10px] uppercase font-bold tracking-tighter ${u.isOnSite ? 'text-emerald-400' : 'text-white/20'}`}>
                          {u.isOnSite ? '● On Site' : '○ Off Site'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-white/10 font-mono text-xs">---</span>
                    )}
                  </td>
                  <td className="p-4">
                    {u.role === 'visitor' && u.durationStart ? (
                      <div className="text-[11px] text-blue-200/60 font-mono">
                        {new Date(u.durationStart).toLocaleDateString()}
                        <span className="mx-1 text-white/20">→</span>
                        {u.durationEnd ? new Date(u.durationEnd).toLocaleDateString() : ' ?'}
                      </div>
                    ) : (
                      <span className="text-white/10 font-mono text-xs">---</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-1.5 rounded-lg text-indigo-300/40 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredResults.length === 0 && (
          <div className="p-12 text-center text-white/10 italic">
            No users found matching your search criteria.
          </div>
        )}


      </div>
    </div>
  )
}
