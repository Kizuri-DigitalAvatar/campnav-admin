"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import {
  Building2,
  Clock,
  Dumbbell,
  Gamepad2,
  ImagePlus,
  Loader2,
  MapPin,
  Mountain,
  Pencil,
  Plus,
  Sofa,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  Waves,
  X,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { toast } from "sonner"

type FacilityBooking = {
  _id: Id<"facilityBookings">
  facility: string
  userName: string
  date: number
  startTime: string
  endTime: string
  status: string
}

const CATEGORIES: Record<string, { label: string; icon: any; amenitiesHint: string }> = {
  fitness: { label: "Fitness / Gym", icon: Dumbbell, amenitiesHint: "e.g. Treadmills, free weights, yoga mats" },
  sports_court: { label: "Sports Court", icon: Trophy, amenitiesHint: "e.g. Rackets, balls, floodlights, scoreboard" },
  swimming: { label: "Swimming / Pool", icon: Waves, amenitiesHint: "e.g. Lap lanes, towels, loungers, lifeguard" },
  recreation_games: { label: "Recreation & Games", icon: Gamepad2, amenitiesHint: "e.g. Pool table, darts, board games, console" },
  wellness_spa: { label: "Wellness & Spa", icon: Sparkles, amenitiesHint: "e.g. Sauna, steam room, massage service" },
  social_lounge: { label: "Social / Lounge", icon: Sofa, amenitiesHint: "e.g. TV, coffee bar, seating, WiFi" },
  outdoor_adventure: { label: "Outdoor & Adventure", icon: Mountain, amenitiesHint: "e.g. Trails, equipment rental, guides" },
  other: { label: "Other", icon: Building2, amenitiesHint: "e.g. Key equipment or services offered" },
}

function categoryMeta(category?: string) {
  return CATEGORIES[category || "other"] || CATEGORIES.other
}

type FacilityDraft = {
  name: string
  description: string
  category: string
  location: string
  capacity: string
  openingTime: string
  closingTime: string
  amenities: string[]
  images: string[] // storage IDs
  previews: string[] // display URLs (existing or local object URLs)
}

function emptyDraft(): FacilityDraft {
  return {
    name: "",
    description: "",
    category: "fitness",
    location: "",
    capacity: "",
    openingTime: "06:00",
    closingTime: "22:00",
    amenities: [],
    images: [],
    previews: [],
  }
}

export default function FacilitiesAdminPage() {
  const facilities = useQuery(api.facilities.listFacilities, { includeInactive: true })
  const bookings = (useQuery(api.facilities.getFacilityBookings, {}) ?? []) as FacilityBooking[]
  const stats = useQuery(api.facilities.getFacilityStats, {})

  const updateStatus = useMutation(api.facilities.updateFacilityBookingStatus)
  const createFacility = useMutation(api.facilities.createFacility)
  const updateFacility = useMutation(api.facilities.updateFacility)
  const deleteFacility = useMutation(api.facilities.deleteFacility)
  const generateUploadUrl = useMutation(api.facilities.generateUploadUrl)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<Id<"facilities"> | null>(null)
  const [draft, setDraft] = useState<FacilityDraft>(emptyDraft)
  const [amenityInput, setAmenityInput] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const openCreate = () => {
    setEditingId(null)
    setDraft(emptyDraft())
    setAmenityInput("")
    setIsFormOpen(true)
  }

  const openEdit = (f: any) => {
    setEditingId(f._id)
    setDraft({
      name: f.name || "",
      description: f.description || "",
      category: f.category || "other",
      location: f.location || "",
      capacity: f.capacity != null ? String(f.capacity) : "",
      openingTime: f.openingTime || "06:00",
      closingTime: f.closingTime || "22:00",
      amenities: f.amenities || [],
      images: f.images || [],
      previews: f.imageUrls || [],
    })
    setAmenityInput("")
    setIsFormOpen(true)
  }

  const addAmenity = () => {
    const value = amenityInput.trim()
    if (!value) return
    if (!draft.amenities.includes(value)) {
      setDraft((d) => ({ ...d, amenities: [...d.amenities, value] }))
    }
    setAmenityInput("")
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const postUrl = await generateUploadUrl()
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })
        const { storageId } = await result.json()
        setDraft((d) => ({
          ...d,
          images: [...d.images, storageId],
          previews: [...d.previews, URL.createObjectURL(file)],
        }))
      }
    } catch (err) {
      console.error("Image upload failed:", err)
      toast.error("Image upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setDraft((d) => ({
      ...d,
      images: d.images.filter((_, i) => i !== index),
      previews: d.previews.filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      toast.error("Facility name is required")
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        category: draft.category,
        location: draft.location.trim() || undefined,
        capacity: draft.capacity ? Number(draft.capacity) : undefined,
        openingTime: draft.openingTime || undefined,
        closingTime: draft.closingTime || undefined,
        amenities: draft.amenities.length ? draft.amenities : undefined,
        images: draft.images.length ? draft.images : undefined,
      }
      if (editingId) {
        await updateFacility({ id: editingId, ...payload })
        toast.success("Facility updated")
      } else {
        await createFacility(payload)
        toast.success("Facility created")
      }
      setIsFormOpen(false)
    } catch (err) {
      console.error("Failed to save facility:", err)
      toast.error("Failed to save facility")
    } finally {
      setIsSaving(false)
    }
  }

  const meta = categoryMeta(draft.category)
  const CategoryIcon = meta.icon

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilities & Recreation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage camp facilities, and approve resident bookings.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-2xl h-11 px-5 gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          New Facility
        </Button>
      </header>

      {/* Facilities grid */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <div className="w-1 h-3 bg-primary rounded-full" />
          Facilities ({facilities?.length ?? 0})
        </h2>

        {facilities === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-3xl" />)}
          </div>
        ) : facilities.length === 0 ? (
          <Card className="rounded-3xl border-2 border-dashed p-16 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-sm font-bold text-muted-foreground">No facilities yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create your first facility so residents can see and book it.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((f: any) => {
              const CatIcon = categoryMeta(f.category).icon
              return (
                <Card key={f._id} className={`rounded-3xl overflow-hidden border-2 flex flex-col ${!f.isActive ? "opacity-60" : ""}`}>
                  <div className="aspect-video bg-muted relative">
                    {f.imageUrls?.[0] ? (
                      <img src={f.imageUrls[0]} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                        <CatIcon className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className="rounded-lg text-[9px] font-black uppercase bg-background/90 text-foreground border shadow-sm">
                        {categoryMeta(f.category).label}
                      </Badge>
                    </div>
                    <span className={`absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border shadow-sm ${f.isActive ? "bg-emerald-500/90 text-white border-emerald-400" : "bg-background/90 text-muted-foreground"}`}>
                      {f.isActive ? "Open" : "Closed"}
                    </span>
                    {(f.imageUrls?.length ?? 0) > 1 && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white text-[9px] font-bold px-2 py-0.5">
                        +{f.imageUrls.length - 1} photos
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{f.name}</h3>
                      {f.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground font-medium">
                      {f.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary/60" />{f.location}</span>
                      )}
                      {f.capacity != null && (
                        <span className="flex items-center gap-1"><Users className="h-3 w-3 text-primary/60" />Up to {f.capacity}</span>
                      )}
                      {f.openingTime && f.closingTime && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary/60" />{f.openingTime} – {f.closingTime}</span>
                      )}
                    </div>
                    {f.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {f.amenities.slice(0, 4).map((a: string) => (
                          <Badge key={a} variant="secondary" className="rounded-lg text-[9px]">{a}</Badge>
                        ))}
                        {f.amenities.length > 4 && (
                          <Badge variant="outline" className="rounded-lg text-[9px]">+{f.amenities.length - 4}</Badge>
                        )}
                      </div>
                    )}
                    <div className="mt-auto pt-3 border-t flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateFacility({ id: f._id, isActive: !f.isActive })
                            .then(() => toast.success(f.isActive ? `${f.name} closed` : `${f.name} opened`))
                            .catch(() => toast.error("Update failed"))
                        }
                        className={`text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-2 border-2 transition-colors ${f.isActive ? "text-amber-600 border-amber-500/30 hover:bg-amber-500/10" : "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"}`}
                      >
                        {f.isActive ? "Close facility" : "Reopen"}
                      </button>
                      <div className="flex gap-1">
                        <Button variant="ghost" className="rounded-xl h-9 w-9 p-0" onClick={() => openEdit(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="rounded-xl h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Permanently delete "${f.name}" and its photos?`)) {
                              deleteFacility({ id: f._id })
                                .then(() => toast.success("Facility deleted"))
                                .catch(() => toast.error("Delete failed"))
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Booking stats */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <div className="w-1 h-3 bg-primary rounded-full" />
          Bookings
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Bookings", stats?.totalBookings ?? 0],
            ["Confirmed", stats?.confirmedBookings ?? 0],
            ["Completed", stats?.completedBookings ?? 0],
            ["Confirm rate", `${stats?.confirmationRate ?? 0}%`],
          ].map(([label, value]) => (
            <Card key={label} className="rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-black">{value}</p>
            </Card>
          ))}
        </div>

        {bookings.length === 0 ? (
          <Card className="rounded-2xl border-dashed p-10 text-center text-xs text-muted-foreground">
            No bookings yet.
          </Card>
        ) : (
          <div className="grid gap-3">
            {bookings.map((booking) => (
              <Card key={booking._id} className="flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-bold capitalize">{booking.facility.replace("_", " ")} - {booking.userName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(booking.date).toLocaleDateString()} | {booking.startTime}-{booking.endTime}</p>
                  </div>
                </div>
                <select className="h-9 rounded-xl border bg-background px-3 text-xs" value={booking.status} onChange={(e) => updateStatus({ bookingId: booking._id, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Create / Edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2rem] border-2 p-0 overflow-hidden gap-0">
          <div className="flex flex-col max-h-[88vh]">
            <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <CategoryIcon className="h-5 w-5 text-primary" />
                {editingId ? "Edit Facility" : "New Facility"}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name *</label>
                  <Input
                    placeholder="e.g. Main Gym, Tennis Court A"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</label>
                  <Select value={draft.category} onValueChange={(v: string) => setDraft((d) => ({ ...d, category: v }))}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {Object.entries(CATEGORIES).map(([value, c]) => (
                        <SelectItem key={value} value={value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</label>
                  <Input
                    placeholder="e.g. Block C, next to the mess hall"
                    value={draft.location}
                    onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                  <textarea
                    placeholder="What is this facility, and what can residents do here?"
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    className="w-full rounded-xl border bg-background p-3 text-sm min-h-[90px] outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Capacity</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Max people at once"
                    value={draft.capacity}
                    onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Opening Hours</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={draft.openingTime}
                      onChange={(e) => setDraft((d) => ({ ...d, openingTime: e.target.value }))}
                      className="h-11 rounded-xl"
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <Input
                      type="time"
                      value={draft.closingTime}
                      onChange={(e) => setDraft((d) => ({ ...d, closingTime: e.target.value }))}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Amenities / Equipment
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={meta.amenitiesHint}
                      value={amenityInput}
                      onChange={(e) => setAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault()
                          addAmenity()
                        }
                      }}
                      className="h-11 rounded-xl flex-1"
                    />
                    <Button type="button" variant="outline" className="h-11 rounded-xl px-4" onClick={addAmenity}>
                      Add
                    </Button>
                  </div>
                  {draft.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {draft.amenities.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-2.5 py-1 text-[10px] font-bold">
                          {a}
                          <button
                            type="button"
                            onClick={() => setDraft((d) => ({ ...d, amenities: d.amenities.filter((x) => x !== a) }))}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Photos</label>
                  <div className="flex flex-wrap gap-3">
                    {draft.previews.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="facility-images"
                      onChange={(e) => {
                        handleImageUpload(e.target.files)
                        e.target.value = ""
                      }}
                    />
                    <label
                      htmlFor="facility-images"
                      className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer text-muted-foreground hover:border-primary hover:text-primary transition-colors ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4" />
                          <span className="text-[9px] font-bold uppercase">Add</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t bg-muted/30 px-6 py-4 flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl h-11 px-6" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="rounded-xl h-11 px-8 font-black uppercase tracking-widest text-[10px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? "Save Changes" : "Create Facility"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
