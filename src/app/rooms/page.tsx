"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../campnav-client/convex/_generated/api"
import { Bed, UserPlus, LogOut, Trash2, Home, Search, Filter, Plus } from "lucide-react"

export default function RoomsPage() {
    const rooms = useQuery(api.rooms.list) ?? []
    // We need a simple non-paginated list of visitors for the dropdown
    // For now we'll assume the client-side list is small enough or implement a helper
    const users = useQuery(api.users.list, { role: "visitor" })
    const visitors = users || []

    const createRoom = useMutation(api.rooms.create)
    const updateRoom = useMutation(api.rooms.update)
    const assignOccupant = useMutation(api.rooms.assignOccupant)
    const deleteRoom = useMutation(api.rooms.deleteRoom)

    const [roomNumber, setRoomNumber] = useState("")
    const [category, setCategory] = useState("standard")
    const [capacity, setCapacity] = useState("2")
    const [price, setPrice] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    async function handleCreate(e: FormEvent) {
        e.preventDefault()
        if (!roomNumber.trim()) return
        await createRoom({
            roomNumber: roomNumber.trim(),
            category,
            capacity: parseInt(capacity),
            pricePerNight: price ? parseFloat(price) : undefined
        })
        setRoomNumber("")
        setPrice("")
        setIsCreating(false)
    }

    async function handleAssign(roomId: any, userId: string) {
        if (userId === "none") {
            await assignOccupant({ roomId, userId: null })
        } else {
            await assignOccupant({ roomId, userId: userId as any })
        }
    }

    async function handleDelete(id: any) {
        if (confirm("Delete this room?")) {
            await deleteRoom({ id })
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Home className="w-8 h-8 text-indigo-400" />
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
                        Room Management
                    </h2>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="glass-button bg-indigo-600/50 flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>{isCreating ? "Discard" : "Add Room"}</span>
                </button>
            </div>

            {isCreating && (
                <div className="glass-card p-6 animate-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm text-blue-200/60 ml-1">Room Number</label>
                            <input
                                className="glass-input w-full"
                                placeholder="A-101"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-blue-200/60 ml-1">Category</label>
                            <select
                                className="glass-input w-full bg-indigo-950/40"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="standard">Standard</option>
                                <option value="deluxe">Deluxe</option>
                                <option value="cabin">Cabin</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-blue-200/60 ml-1">Capacity</label>
                            <input
                                className="glass-input w-full"
                                type="number"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-blue-200/60 ml-1">Price / Night</label>
                            <input
                                className="glass-input w-full"
                                placeholder="Le 0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-4 flex justify-end">
                            <button type="submit" className="glass-button bg-emerald-600/50 px-8">Save Room</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room: any) => (
                    <div key={room._id} className="glass-card p-6 group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-xl border ${room.status === 'occupied' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                    room.status === 'maintenance' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    }`}>
                                    <Bed className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-blue-50">Room {room.roomNumber}</h4>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/20">{room.category}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(room._id)}
                                className="p-1 opacity-0 group-hover:opacity-100 text-red-400/40 hover:text-red-400 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-xs">
                                <span className="text-white/40">Capacity</span>
                                <span className="text-blue-100 font-mono">{room.capacity} Persons</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/40">Daily Rate</span>
                                <span className="text-emerald-400 font-mono">Le {room.pricePerNight || 0}</span>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <label className="text-[10px] uppercase font-bold tracking-widest text-white/20 mb-2 block">
                                    Current Assignment
                                </label>
                                <div className="flex items-center space-x-2">
                                    <select
                                        className="glass-input w-full text-xs py-1.5 h-auto bg-white/5"
                                        value={room.occupantId || "none"}
                                        onChange={(e) => handleAssign(room._id, e.target.value)}
                                    >
                                        <option value="none">Empty (Available)</option>
                                        <optgroup label="Registered Visitors" className="bg-slate-900 text-blue-200">
                                            {visitors.map((v: any) => (
                                                <option key={v._id} value={v._id}>{v.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    {room.occupantId && (
                                        <button
                                            onClick={() => handleAssign(room._id, "none")}
                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                            title="Clear occupancy"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                {room.occupantName && (
                                    <div className="mt-2 flex items-center space-x-1.5 text-xs text-amber-400/80 italic">
                                        <UserPlus className="w-3 h-3" />
                                        <span>Occupied by {room.occupantName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`absolute bottom-0 left-0 right-0 h-1 ${room.status === 'occupied' ? 'bg-amber-500/30' :
                            room.status === 'maintenance' ? 'bg-red-500/30' :
                                'bg-emerald-500/30'
                            }`} />
                    </div>
                ))}
            </div>

            {rooms.length === 0 && (
                <div className="p-20 text-center glass-card border-dashed">
                    <Bed className="w-16 h-16 text-white/5 mx-auto mb-4" />
                    <p className="text-white/20 italic">No rooms have been defined in the system.</p>
                </div>
            )}
        </div>
    )
}
