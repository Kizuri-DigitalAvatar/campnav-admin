"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

import { Upload, X, Trash2, Search, Filter, UserCog } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const ROLE_OPTIONS = [
  { value: "camp_manager", label: "Camp Manager", category: "admin", subcategory: "super_admin", accessLevel: 5 },
  { value: "camp_supervisor", label: "Camp Supervisor", category: "admin", accessLevel: 4 },
  { value: "staff", label: "Staff", category: "staff", accessLevel: 3 },
  { value: "resident", label: "Residents", category: "residents", accessLevel: 1 },
]

const SUBCATEGORY_OPTIONS: Record<string, { value: string; label: string }[]> = {
  camp_manager: [
    { value: "super_admin", label: "Super Admin" },
  ],
  camp_supervisor: [
    { value: "house_grounds", label: "House & Grounds" },
    { value: "shop_amenities", label: "Shop / Amenities" },
    { value: "maintenance", label: "Maintenance" },
    { value: "kitchen", label: "Kitchen" },
  ],
  staff: [
    { value: "room_service", label: "Room Service" },
    { value: "housekeeping", label: "Housekeeping" },
    { value: "maintenance", label: "Maintenance" },
    { value: "laundry", label: "Laundry" },
  ],
  resident: [
    { value: "guest", label: "Guest" },
    { value: "resident", label: "Resident" },
  ],
}

const ROLE_FILTERS = [
  { value: "all", label: "All Roles" },
  ...ROLE_OPTIONS.map((role) => ({ value: role.value, label: role.label })),
]

function getRoleMeta(role?: string) {
  return ROLE_OPTIONS.find((option) => option.value === role) || ROLE_OPTIONS[3]
}

function normalizeRole(role?: string) {
  if (role === "admin") return "camp_supervisor"
  if (role === "camp-staff") return "staff"
  if (role === "visitor" || role === "camper") return "resident"
  return role || "resident"
}

function normalizeSubcategory(role: string, subcategory?: string, department?: string) {
  if (subcategory) return subcategory
  if (department) return department
  return SUBCATEGORY_OPTIONS[role]?.[0]?.value || ""
}

function getSubcategoryLabel(role?: string, subcategory?: string) {
  const match = SUBCATEGORY_OPTIONS[role || ""]?.find((option) => option.value === subcategory)
  return match?.label || subcategory?.replaceAll("_", " ") || "Not assigned"
}

export default function UsersPage() {
  const [filterRole, setFilterRole] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const users = useQuery(api.users.list, { role: filterRole })
  const userList = users ?? []

  const upsertUser = useMutation(api.users.upsert)
  const deleteUser = useMutation(api.users.deleteUser)
  const generateUploadUrl = useMutation(api.images.generateUploadUrl)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [image, setImage] = useState("") // storageId or old url
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [role, setRole] = useState("resident")
  const [userSubcategory, setUserSubcategory] = useState("guest")
  const [assignedDuties, setAssignedDuties] = useState<string[]>([])
  const [durationStart, setDurationStart] = useState("")
  const [durationEnd, setDurationEnd] = useState("")
  const [isOnSite, setIsOnSite] = useState(false)
  const [campStaffId, setCampStaffId] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const roleMeta = getRoleMeta(role)
  const roleSubcategories = SUBCATEGORY_OPTIONS[role] || []

  const filteredResults = userList.filter((u: any) =>
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
    const selectedRole = getRoleMeta(role)
    const primaryDuty = role === "staff" && userSubcategory ? [userSubcategory] : []
    const staffDuties = assignedDuties.length > 0 ? assignedDuties : primaryDuty
    const department = role === "camp_supervisor" || role === "staff" ? userSubcategory : undefined

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
        userCategory: selectedRole.category,
        userSubcategory,
        department,
        accessLevel: selectedRole.accessLevel,
        assignedDuties: role === 'staff' ? staffDuties : undefined,
        durationStart: role === "resident" && userSubcategory === "guest" && durationStart ? new Date(durationStart).getTime() : undefined,
        durationEnd: role === "resident" && userSubcategory === "guest" && durationEnd ? new Date(durationEnd).getTime() : undefined,
        isOnSite: role === 'staff' || role === "camp_supervisor" ? isOnSite : undefined,
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
    setRole("resident")
    setUserSubcategory("guest")
    setAssignedDuties([])
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
    const nextRole = normalizeRole(user.role)
    setRole(nextRole)
    setUserSubcategory(normalizeSubcategory(nextRole, user.userSubcategory, user.department))
    setAssignedDuties(user.assignedDuties || [])
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
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
            <UserCog className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            User Management
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full md:w-64 pl-10 h-10 rounded-xl border bg-card focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-card border rounded-xl px-3 h-10">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              className="bg-transparent text-xs font-bold outline-none cursor-pointer"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              {ROLE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>{filter.label.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold mb-8">
          {editingId ? "Edit User Account" : "Register New Account"}
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Profile Photo</label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden group relative transition-all hover:border-primary">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setImagePreview(null); setImage(""); }}
                        className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center p-4 text-center">
                      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-[10px] text-muted-foreground font-black uppercase">Upload</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium space-y-1">
                  <p>PNG, JPG UP TO 5MB</p>
                  <p>REC: 200X200 PX</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
              <input
                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
              <input
                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="john@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 font-mono">Password</label>
              <input
                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Level / Role</label>
              <select
                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={role}
                onChange={(e) => {
                  const nextRole = e.target.value
                  setRole(nextRole)
                  setUserSubcategory(SUBCATEGORY_OPTIONS[nextRole]?.[0]?.value || "")
                  setAssignedDuties([])
                  setDurationStart("")
                  setDurationEnd("")
                }}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.category.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
              <input
                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm capitalize text-muted-foreground"
                value={roleMeta.category.replace("_", " ")}
                readOnly
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subcategory / Priority</label>
              <select
                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={userSubcategory}
                onChange={(e) => {
                  setUserSubcategory(e.target.value)
                  if (role === "staff") {
                    setAssignedDuties([e.target.value])
                  }
                }}
              >
                {roleSubcategories.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Access priority level {roleMeta.accessLevel}
              </p>
            </div>

            {role === 'staff' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Staff ID</label>
                  <input
                    className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="STF-001"
                    value={campStaffId}
                    onChange={(e) => setCampStaffId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assigned Duties</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SUBCATEGORY_OPTIONS.staff.map(({ value: duty, label }) => (
                      <label key={duty} className="flex items-center space-x-2 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border bg-background accent-primary"
                          checked={assignedDuties.includes(duty)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedDuties([...assignedDuties, duty])
                            } else {
                              setAssignedDuties(assignedDuties.filter(d => d !== duty))
                            }
                          }}
                        />
                        <span className="text-xs font-bold capitalize">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-3 h-11 pt-1 px-2">
                  <input
                    type="checkbox"
                    id="isOnSite"
                    className="w-4 h-4 rounded border-border bg-muted accent-primary"
                    checked={isOnSite}
                    onChange={(e) => setIsOnSite(e.target.checked)}
                  />
                  <label htmlFor="isOnSite" className="text-sm font-bold cursor-pointer">
                    CURRENTLY ON SITE
                  </label>
                </div>
              </>
            )}

            {role === 'camp_supervisor' && (
              <div className="flex items-center space-x-3 h-11 pt-1 px-2">
                <input
                  type="checkbox"
                  id="supervisorOnSite"
                  className="w-4 h-4 rounded border-border bg-muted accent-primary"
                  checked={isOnSite}
                  onChange={(e) => setIsOnSite(e.target.checked)}
                />
                <label htmlFor="supervisorOnSite" className="text-sm font-bold cursor-pointer">
                  CURRENTLY ON SITE
                </label>
              </div>
            )}

            {role === 'resident' && userSubcategory === "guest" && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visit Start</label>
                  <input
                    className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    type="date"
                    value={durationStart}
                    onChange={(e) => setDurationStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visit End</label>
                  <input
                    className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    type="date"
                    value={durationEnd}
                    onChange={(e) => setDurationEnd(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-3 flex gap-3 pt-6 border-t font-bold">
            <button
              type="submit"
              disabled={isUploading}
              className="bg-primary text-primary-foreground min-w-[160px] h-11 rounded-xl px-6 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isUploading ? "PROCESS..." : (editingId ? "SAVE CHANGES" : "REGISTER ACCOUNT")}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-muted text-foreground px-6 h-11 rounded-xl hover:bg-muted/80 transition-all"
              >
                CANCEL
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px] tracking-widest font-black">
              <tr className="border-b">
                <th className="px-6 py-4">User Identity</th>
                <th className="px-6 py-4 text-center">Role / Access</th>
                <th className="px-6 py-4">Status / Meta</th>
                <th className="px-6 py-4">Timeframe</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users === undefined ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center px-6">
                      <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-6 w-32 rounded-md" />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-12 rounded-xl" />
                        <Skeleton className="h-8 w-8 rounded-xl" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredResults.map((u: any) => {
                  const normalizedRole = normalizeRole(u.role)
                  const normalizedSubcategory = normalizeSubcategory(normalizedRole, u.userSubcategory, u.department)
                  const userRole = getRoleMeta(normalizedRole)
                  const subcategoryLabel = getSubcategoryLabel(normalizedRole, normalizedSubcategory)

                  return (
                <tr key={u._id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full border bg-muted overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center">
                        {u.imageUrl ? (
                          <img src={u.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-black text-xs opacity-20">
                            {u.name[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm tracking-tight">{u.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono italic">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${normalizedRole === 'camp_manager' ? 'bg-primary text-primary-foreground border-primary' :
                      normalizedRole === 'camp_supervisor' ? 'bg-primary/10 text-primary border-primary/30' :
                      'bg-muted text-muted-foreground border-border'
                      }`}>
                      {userRole.label}
                    </span>
                    <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {userRole.category} / {subcategoryLabel}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {normalizedRole === 'staff' ? (
                      <div className="space-y-1">
                        <div className="text-xs font-bold font-mono text-muted-foreground">{u.campStaffId || 'N/A'}</div>
                        {u.assignedDuties && u.assignedDuties.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {u.assignedDuties.map((duty: string) => (
                              <span key={duty} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase">
                                {duty.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${u.isOnSite ? 'text-primary' : 'opacity-20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${u.isOnSite ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                          {u.isOnSite ? 'On Site' : 'Off Site'}
                        </div>
                      </div>
                    ) : normalizedRole === 'camp_supervisor' || normalizedRole === 'camp_manager' ? (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-muted-foreground capitalize">{subcategoryLabel}</div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-primary">
                          Priority {u.accessLevel || userRole.accessLevel}
                        </div>
                      </div>
                    ) : normalizedRole === 'resident' ? (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-muted-foreground capitalize">{subcategoryLabel}</div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/70">
                          Priority {u.accessLevel || userRole.accessLevel}
                        </div>
                      </div>
                    ) : (
                      <span className="opacity-20 font-mono text-xs">---</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {normalizedRole === 'resident' && normalizedSubcategory === "guest" && u.durationStart ? (
                      <div className="text-[10px] font-bold text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded-md border w-fit">
                        {new Date(u.durationStart).toLocaleDateString()}
                        <span className="mx-2 opacity-30">|</span>
                        {u.durationEnd ? new Date(u.durationEnd).toLocaleDateString() : ' ?'}
                      </div>
                    ) : (
                      <span className="opacity-20 font-mono text-xs">---</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right space-x-1">
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover:opacity-100 font-bold text-[10px] uppercase border bg-card"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                  )
                }))}
            </tbody>
          </table>
        </div>
        {users !== undefined && filteredResults.length === 0 && (
          <div className="p-16 text-center text-muted-foreground/30 font-medium">
            <p>No users found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
