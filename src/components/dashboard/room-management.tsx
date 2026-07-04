"use client"

import { createElement, useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { Bed, Home, Users, Plus, Edit, Trash2, Search, BedDouble, Crown, Building, LogOut, UserPlus } from "lucide-react"
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

  const residentOptions = users.filter((user) => user.role === "resident" || user.role === "visitor")

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

      {/* Filters and Actions */}
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
              className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {ROOM_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              {ROOM_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Add Room
            </button>
          </div>
        </div>
      </div>

      {/* Room Categories Overview */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {ROOM_CATEGORIES.map((category, i) => (
          <div key={category.value} className="bg-card border rounded-3xl p-6 shadow-sm">
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
                    {EXECUTIVE_ROOMS.map(roomNumber => (
                      <div key={roomNumber} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-mono text-sm">{roomNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getPredefinedRoomColor(getPredefinedRoomStatus(roomNumber))}`}>
                          {getPredefinedRoomStatus(roomNumber).replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {category.value === "hq_house" && (
                <div>
                  <h4 className="font-medium mb-2">HQ House</h4>
                  <div className="space-y-2">
                    {HQ_HOUSE_ROOMS.map(block => (
                      <div key={block.block} className="border rounded-lg p-3">
                        <div className="font-medium mb-2">{block.block}</div>
                        <div className="grid gap-2 grid-cols-2">
                          {block.rooms.map(room => (
                            <div key={room} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-mono text-sm">{room}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getPredefinedRoomColor(getPredefinedRoomStatus(room))}`}>
                                {getPredefinedRoomStatus(room).replace("_", " ").toUpperCase()}
                              </span>
                            </div>
                          ))}
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
                      <div key={block.block} className="border rounded-lg p-3">
                        <div className="font-medium mb-2">{block.block}</div>
                        <div className="grid gap-2 grid-cols-2">
                          {block.rooms.map(room => (
                            <div key={room} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-mono text-sm">{room}</span>
                              <span className={`text-xs px-2 py-1 rounded ${getPredefinedRoomColor(getPredefinedRoomStatus(room))}`}>
                                {getPredefinedRoomStatus(room).replace("_", " ").toUpperCase()}
                              </span>
                            </div>
                          ))}
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

      {/* Rooms List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">All Rooms</h3>
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {filteredRooms.map((room) => (
              <article
                key={room._id}
                className={`bg-card border rounded-3xl p-6 lg:p-8 group relative overflow-hidden transition-all hover:shadow-xl ${room.status === "occupied" ? "border-primary/20" : ""}`}
              >
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className={`p-4 rounded-2xl border shadow-sm shrink-0 ${room.status === "occupied"
                      ? "bg-primary text-primary-foreground border-primary"
                      : room.status === "maintenance"
                        ? "bg-muted text-destructive border-destructive/20"
                        : "bg-muted text-muted-foreground border-border"
                      }`}>
                      <Bed className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none truncate">
                        Room {room.roomNumber}
                      </h4>
                      <span className="mt-3 block text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground/60">
                        {room.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(room)}
                      className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90"
                      aria-label={`Edit room ${room.roomNumber}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                      aria-label={`Delete room ${room.roomNumber}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-end border-b pb-4 border-dashed">
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Capacity</span>
                    <span className="text-base font-bold">{room.capacity} Persons</span>
                  </div>
                  <div className="flex justify-between items-end border-b pb-4 border-dashed">
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Rate</span>
                    <span className="text-base font-black text-primary uppercase">
                      Le {(room.pricePerNight || 0).toLocaleString()} / Night
                    </span>
                  </div>

                  <div className="pt-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-4 block">
                      Current Occupant
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        className={`flex-1 min-w-0 h-12 rounded-xl border text-[11px] font-black uppercase tracking-widest px-4 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 ${room.occupantId
                          ? "bg-background text-foreground border-border"
                          : "bg-muted/50 text-muted-foreground/60 border-transparent"
                          }`}
                        value={room.occupantId || ""}
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
                          className="p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/10 active:scale-95 transition-all"
                          aria-label={`Clear occupant for room ${room.roomNumber}`}
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {room.occupantName && (
                      <div className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 text-primary border border-primary/10">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Assigned to {room.occupantName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-2 transition-colors ${room.status === "occupied"
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
                  <label className="block text-sm font-medium mb-2">Room Number *</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., E1, H1:1, R1:B1"
                    required
                  />
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
                    {ROOM_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="px-6 py-2 border rounded-xl hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
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
