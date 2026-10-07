"use client"

import { createElement, useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { Bed, Home, Users, Plus, Edit, Trash2, Search, BedDouble, Crown, Building, LogOut, LayoutGrid } from "lucide-react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

interface RoomFormData {
  roomNumber: string
  category: string
  capacity: number
  pricePerNight: number
  status: string
}

type AdminUser = {
  _id: Id<"users">
  name: string
  role?: string
}

type RoomWithOccupant = {
  _id: Id<"rooms">
  roomNumber: string
  category: string
  capacity: number
  status: string
  occupantId?: Id<"users">
  occupantName?: string | null
  pricePerNight?: number
}

const ROOM_CATEGORIES = [
  { value: "executive", label: "Executive", icon: Crown, color: "text-purple-600 bg-purple-100" },
  { value: "hq_house", label: "HQ House", icon: Building, color: "text-blue-600 bg-blue-100" },
  { value: "standard", label: "Standard", icon: Home, color: "text-green-600 bg-green-100" },
]

type RoomTab = "all" | "categories"

const ROOM_TABS: { key: RoomTab; label: string; icon: typeof Bed }[] = [
  { key: "all", label: "All Rooms", icon: Bed },
  { key: "categories", label: "Categories", icon: LayoutGrid },
]

const ROOM_STATUS = [
  { value: "available", label: "Available", color: "text-green-600 bg-green-100" },
  { value: "occupied", label: "Occupied", color: "text-blue-600 bg-blue-100" },
  { value: "maintenance", label: "Maintenance", color: "text-orange-600 bg-orange-100" },
]

const EXECUTIVE_ROOMS = ["E1", "E2", "E3", "E4"]
const HQ_HOUSE_ROOMS = [
  { block: "H1", rooms: ["H1:1", "H1:2"] },
  { block: "H2", rooms: ["H2:1", "H2:2"] },
  { block: "H3", rooms: ["H3:1", "H3:2"] },
]
const STANDARD_ROOMS = [
  { block: "R1", rooms: ["R1:B1", "R1:B2"] },
  { block: "R2", rooms: ["R2:B1", "R2:B2"] },
  { block: "R3", rooms: ["R3:B1", "R3:B2"] },
  { block: "R4", rooms: ["R4:B1", "R4:B2"] },
  { block: "R5", rooms: ["R5:B1", "R5:B2"] },
  { block: "R6", rooms: ["R6:B1", "R6:B2"] },
  { block: "R7", rooms: ["R7:B1", "R7:B2"] },
  { block: "R8", rooms: ["R8:B1", "R8:B2"] },
  { block: "R9", rooms: ["R9:B1", "R9:B2"] },
  { block: "R10", rooms: ["R10:B1", "R10:B2"] },
]

export default function RoomManagement() {
  const rooms = (useQuery(api.rooms.list) || []) as RoomWithOccupant[]
  const users = (useQuery(api.users.listAll) || []) as AdminUser[]
  const createRoom = useMutation(api.rooms.create)
  const updateRoom = useMutation(api.rooms.update)
  const deleteRoom = useMutation(api.rooms.deleteRoom)
  const assignOccupant = useMutation(api.rooms.assignOccupant)
  
  const [activeTab, setActiveTab] = useState<RoomTab>("all")
  const [showForm, setShowForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Id<"rooms"> | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  
  const [formData, setFormData] = useState<RoomFormData>({
    roomNumber: "",
    category: "",
    capacity: 1,
    pricePerNight: 0,
    status: "available",
  })

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || room.category === filterCategory
    const matchesStatus = !filterStatus || room.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Category order (Executive, HQ House, Standard), then natural room order: E1, H1:1, R1:B1, R2:B1 ... R10:B1
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const ca = ROOM_CATEGORIES.findIndex(c => c.value === a.category)
    const cb = ROOM_CATEGORIES.findIndex(c => c.value === b.category)
    if (ca !== cb) return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb)
    return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingRoom) {
        await updateRoom({
          id: editingRoom,
          ...formData,
        })
      } else {
        await createRoom(formData)
      }
      
      // Reset form
      setFormData({
        roomNumber: "",
        category: "",
        capacity: 1,
        pricePerNight: 0,
        status: "available",
      })
      setShowForm(false)
      setEditingRoom(null)
    } catch (error) {
      console.error("Error saving room:", error)
    }
  }

  const handleEdit = (room: RoomWithOccupant) => {
    setFormData({
      roomNumber: room.roomNumber,
      category: room.category,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight || 0,
      status: room.status,
    })
    setEditingRoom(room._id)
    setShowForm(true)
  }

  const handleDelete = async (roomId: Id<"rooms">) => {
    if (confirm("Are you sure you want to delete this room?")) {
      try {
        await deleteRoom({ id: roomId })
      } catch (error) {
        console.error("Error deleting room:", error)
      }
    }
  }

  const handleAssignOccupant = async (roomId: Id<"rooms">, userId: Id<"users"> | null) => {
    try {
      await assignOccupant({ roomId, userId })
    } catch (error) {
      console.error("Error assigning occupant:", error)
    }
  }

  const getCategoryIcon = (category: string) => {
    const roomCategory = ROOM_CATEGORIES.find(c => c.value === category)
    return roomCategory ? roomCategory.icon : Home
  }

  const getCategoryColor = (category: string) => {
    const roomCategory = ROOM_CATEGORIES.find(c => c.value === category)
    return roomCategory ? roomCategory.color : "text-gray-600 bg-gray-100"
  }

  const getStatusColor = (status: string) => {
    const roomStatus = ROOM_STATUS.find(s => s.value === status)
    return roomStatus ? roomStatus.color : "text-gray-600 bg-gray-100"
  }

  const getRoomByNumber = (roomNumber: string) => rooms.find(room => room.roomNumber === roomNumber)

  const getPredefinedRoomStatus = (roomNumber: string) => {
    const room = getRoomByNumber(roomNumber)
    return room?.status || "not_added"
  }

  const getPredefinedRoomColor = (status: string) => {
    if (status === "available") return "text-green-600 bg-green-100"
    if (status === "occupied") return "text-blue-600 bg-blue-100"
    if (status === "maintenance") return "text-orange-600 bg-orange-100"
    return "text-gray-400 bg-gray-100"
  }

  const getPredefinedRoomsForCategory = (category: string) => {
    if (category === "executive") return EXECUTIVE_ROOMS
    if (category === "hq_house") return HQ_HOUSE_ROOMS.flatMap(b => b.rooms)
    if (category === "standard") return STANDARD_ROOMS.flatMap(b => b.rooms)
    return []
  }

  const handleAddNow = async (roomNumber: string, category: string) => {
    let capacity = 1
    let pricePerNight = 50
    if (category === "executive") {
      capacity = 2
      pricePerNight = 150
    } else if (category === "hq_house") {
      capacity = 2
      pricePerNight = 100
    }

    try {
      await createRoom({
        roomNumber,
        category,
        capacity,
        pricePerNight,
        status: "available",
      })
    } catch (error) {
      console.error("Error creating room:", error)
    }
  }

  const residentOptions = users.filter((user) => user.role === "resident" || user.role === "visitor")

  const renderPredefinedRoomCell = (roomNumber: string, category: string) => {
    const room = getRoomByNumber(roomNumber)
    const status = room ? room.status : "not_added"
    
    return (
      <div key={roomNumber} className="min-w-0 flex flex-col gap-2 p-2.5 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-mono text-sm font-bold text-foreground truncate">{roomNumber}</span>
          <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${getPredefinedRoomColor(status)}`}>
            {status.replace("_", " ").toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          {!room ? (
            <button
              onClick={() => handleAddNow(roomNumber, category)}
              className="w-full text-[10px] font-black uppercase tracking-wider py-1.5 px-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-95 transition-all text-center cursor-pointer border-none font-bold"
            >
              Add Now
            </button>
          ) : (
            <>
              <select
                className="flex-1 min-w-0 w-full truncate text-[10px] font-black uppercase tracking-wider py-1.5 pl-2 pr-6 bg-muted hover:bg-muted/80 text-foreground border rounded-lg cursor-pointer outline-none transition-colors"
                value={room.occupantId || ""}
                title={room.occupantName || "Vacant — assign a resident"}
                aria-label={`Assign occupant for room ${roomNumber}`}
                onChange={(e) => {
                  const val = e.target.value
                  handleAssignOccupant(room._id, val ? val as Id<"users"> : null)
                }}
              >
                <option value="">Vacant</option>
                {residentOptions.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => handleDelete(room._id)}
                className="shrink-0 p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors border border-destructive/10 active:scale-95 cursor-pointer"
                title="Delete room"
                aria-label={`Delete room ${roomNumber}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">
          Room Management
        </h2>
        <p className="text-muted-foreground mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Executive, HQ House & Standard Room Categories</p>
      </header>

      {/* Stats Overview */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Rooms', value: rooms.length, icon: Bed },
          { label: 'Available', value: rooms.filter(r => r.status === "available").length, icon: BedDouble },
          { label: 'Occupied', value: rooms.filter(r => r.status === "occupied").length, icon: Users },
          { label: 'Maintenance', value: rooms.filter(r => r.status === "maintenance").length, icon: Home },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-muted flex items-center justify-center">
                <stat.icon size={20} className="text-foreground" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50">ROOM_V.{i + 1}</span>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-black font-mono">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-3 border-b">
        <div role="tablist" aria-label="Room views" className="flex gap-2 overflow-x-auto">
          {ROOM_TABS.map((tab) => {
            const isActive = tab.key === activeTab
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-4 py-3 -mb-px border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {createElement(tab.icon, { className: "w-4 h-4" })}
                <span className="text-sm font-black tracking-tight">{tab.label}</span>
                {tab.key === "all" && (
                  <span className="text-[9px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{rooms.length}</span>
                )}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="self-end sm:self-auto sm:mb-2 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity cursor-pointer font-bold"
        >
          <Plus size={16} />
          Add Room
        </button>
      </div>

      {/* All Rooms tab (default): filters + room cards */}
      {activeTab === "all" && (
      <div className="space-y-6">
      <div className="bg-card border rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
            >
              <option value="">All Categories</option>
              {ROOM_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold"
            >
              <option value="">All Status</option>
              {ROOM_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-end">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            {filteredRooms.length} shown
          </span>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="p-16 text-center bg-muted/20 border-2 border-dashed rounded-3xl">
            <Bed className="w-12 h-12 text-muted-foreground/20 mx-auto mb-6" />
            <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase italic">No rooms found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {sortedRooms.map((room) => (
              <article
                key={room._id}
                className={`bg-card border rounded-2xl p-4 group relative overflow-hidden transition-all hover:shadow-lg ${room.status === "occupied" ? "border-primary/20" : ""}`}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${room.status === "occupied"
                      ? "bg-primary text-primary-foreground border-primary"
                      : room.status === "maintenance"
                        ? "bg-muted text-destructive border-destructive/20"
                        : "bg-muted text-muted-foreground border-border"
                      }`}>
                      <Bed className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-black text-foreground uppercase tracking-tight leading-tight truncate">
                        Room {room.roomNumber}
                      </h4>
                      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">
                        {room.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(room)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90 cursor-pointer"
                      aria-label={`Edit room ${room.roomNumber}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all active:scale-90 cursor-pointer"
                      aria-label={`Delete room ${room.roomNumber}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl bg-muted/40 px-3 py-2">
                    <dt className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Capacity</dt>
                    <dd className="text-sm font-bold">{room.capacity} {room.capacity === 1 ? "Person" : "Persons"}</dd>
                  </div>
                  <div className="rounded-xl bg-muted/40 px-3 py-2">
                    <dt className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rate</dt>
                    <dd className="text-sm font-black text-primary">Le {(room.pricePerNight || 0).toLocaleString()}<span className="text-[10px] font-bold text-muted-foreground"> / night</span></dd>
                  </div>
                </dl>

                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5 block">
                  Current Occupant
                </label>
                <div className="flex items-center gap-2">
                  <select
                    className={`flex-1 min-w-0 w-full truncate h-10 rounded-xl border text-[11px] font-black uppercase tracking-wider pl-3 pr-8 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 ${room.occupantId
                      ? "bg-background text-foreground border-border"
                      : "bg-muted/50 text-muted-foreground/60 border-transparent"
                      }`}
                    value={room.occupantId || ""}
                    title={room.occupantName || "Vacant"}
                    onChange={(e) => handleAssignOccupant(room._id, e.target.value ? e.target.value as Id<"users"> : null)}
                    aria-label={`Assign occupant for room ${room.roomNumber}`}
                  >
                    <option value="">VACANT</option>
                    {residentOptions.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  {room.occupantId && (
                    <button
                      onClick={() => handleAssignOccupant(room._id, null)}
                      className="shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/10 active:scale-95 transition-all cursor-pointer"
                      aria-label={`Clear occupant for room ${room.roomNumber}`}
                      title="Check out occupant"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-1 transition-colors ${room.status === "occupied"
                  ? "bg-primary"
                  : room.status === "maintenance"
                    ? "bg-destructive"
                    : "bg-muted"
                  }`} />
              </article>
            ))}
          </div>
        )}
      </section>
      </div>
      )}

      {/* Categories tab: predefined rooms grouped by category and block */}
      {activeTab === "categories" && (
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 items-start">
        {ROOM_CATEGORIES.map((category, i) => (
          <div key={category.value} className="min-w-0 bg-card border rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${category.color}`}>
                  {createElement(category.icon, { size: 20 })}
                </div>
                <h3 className="text-lg font-bold">{category.label}</h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50">CAT_{i + 1}</span>
            </div>
            
            <div className="space-y-3">
              {category.value === "executive" && (
                <div>
                  <h4 className="font-medium mb-2">Executive Rooms</h4>
                  <div className="grid gap-2 grid-cols-2">
                    {EXECUTIVE_ROOMS.map(roomNumber => renderPredefinedRoomCell(roomNumber, "executive"))}
                  </div>
                </div>
              )}
              
              {category.value === "hq_house" && (
                <div>
                  <h4 className="font-medium mb-2">HQ House</h4>
                  <div className="space-y-2">
                    {HQ_HOUSE_ROOMS.map(block => (
                      <div key={block.block} className="border rounded-2xl p-2.5 bg-muted/20">
                        <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 px-0.5">{block.block}</div>
                        <div className="grid gap-2 grid-cols-2">
                          {block.rooms.map(room => renderPredefinedRoomCell(room, "hq_house"))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {category.value === "standard" && (
                <div>
                  <h4 className="font-medium mb-2">Standard Rooms</h4>
                  <div className="space-y-2">
                    {STANDARD_ROOMS.map(block => (
                      <div key={block.block} className="border rounded-2xl p-2.5 bg-muted/20">
                        <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 px-0.5">{block.block}</div>
                        <div className="grid gap-2 grid-cols-2">
                          {block.rooms.map(room => renderPredefinedRoomCell(room, "standard"))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Room Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingRoom ? "Edit Room" : "Add New Room"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value, roomNumber: ""})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  >
                    <option value="">Select category</option>
                    {ROOM_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Room Name *</label>
                  <select
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    required
                  >
                    <option value="">Select room name</option>
                    {formData.category ? (
                      getPredefinedRoomsForCategory(formData.category)
                        .filter(num => !rooms.some(r => r.roomNumber === num) || (editingRoom && formData.roomNumber === num))
                        .map(num => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))
                    ) : (
                      <option value="" disabled>Please select category first</option>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Price per Night</label>
                  <input
                    type="number"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({...formData, pricePerNight: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  {ROOM_STATUS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border rounded-xl hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {editingRoom ? "Update Room" : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
