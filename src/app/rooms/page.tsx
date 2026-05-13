"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Bed, UserPlus, LogOut, Trash2, Home, Search, Filter, Plus, X } from "lucide-react"

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
        <div className="space-y-8 md:space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                        <Home className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Accommodation</h1>
                        <p className="text-sm text-muted-foreground mt-1">Configure site availability and occupancy mappings</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className={`flex items-center gap-2 h-11 px-6 rounded-xl font-black text-[11px] tracking-widest transition-all shadow-md active:scale-95 ${isCreating ? 'bg-muted text-foreground border' : 'bg-primary text-primary-foreground hover:opacity-90'
                        }`}
                >
                    {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span className="uppercase">{isCreating ? "DISCARD" : "ADD NEW ROOM"}</span>
                </button>
            </div>

            {isCreating && (
                <div className="bg-card border rounded-3xl p-6 md:p-8 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-xl font-bold mb-8 uppercase tracking-tighter">Room Configuration</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Room Number</label>
                            <input
                                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                placeholder="e.g. A-101"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                            <select
                                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="standard">Standard</option>
                                <option value="deluxe">Deluxe</option>
                                <option value="cabin">Cabin</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Max Capacity</label>
                            <input
                                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                type="number"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price / Night</label>
                            <input
                                className="w-full h-11 rounded-xl border bg-muted/50 px-4 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-4 flex justify-end">
                            <button
                                type="submit"
                                className="bg-primary text-primary-foreground h-11 px-10 rounded-xl font-black text-[11px] tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95 uppercase"
                            >
                                SAVE ROOM
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {rooms.map((room: any) => (
                    <div key={room._id} className={`bg-card border rounded-3xl p-6 lg:p-8 group relative overflow-hidden transition-all hover:shadow-xl ${room.status === 'occupied' ? 'border-primary/20' : ''}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-2xl border transition-colors ${room.status === 'occupied' ? 'bg-primary text-primary-foreground border-primary' :
                                    room.status === 'maintenance' ? 'bg-muted text-destructive border-destructive/20' :
                                        'bg-muted text-muted-foreground border-border shadow-sm'
                                    }`}>
                                    <Bed className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none mb-1">Room {room.roomNumber}</h4>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{room.category}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(room._id)}
                                className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="flex justify-between items-end border-b pb-3 border-dashed">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Capacity</span>
                                <span className="text-sm font-bold">{room.capacity} Persons</span>
                            </div>
                            <div className="flex justify-between items-end border-b pb-3 border-dashed">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rate</span>
                                <span className="text-sm font-black text-primary uppercase">Le {room.pricePerNight?.toLocaleString() || 0} / Night</span>
                            </div>

                            <div className="pt-6">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">
                                    Current Occupant
                                </label>
                                <div className="flex items-center gap-2">
                                    <select
                                        className={`flex-1 h-10 rounded-xl border text-[11px] font-black uppercase tracking-widest px-4 transition-all cursor-pointer outline-none ${room.occupantId ? 'bg-background text-foreground border-border' : 'bg-muted/50 text-muted-foreground/50 border-transparent'
                                            }`}
                                        value={room.occupantId || "none"}
                                        onChange={(e) => handleAssign(room._id, e.target.value)}
                                    >
                                        <option value="none" className="font-sans lowercase">VACANT</option>
                                        <optgroup label="Available Visitors" className="font-sans lowercase bg-white">
                                            {visitors.map((v: any) => (
                                                <option key={v._id} value={v._id} className="font-sans lowercase">{v.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    {room.occupantId && (
                                        <button
                                            onClick={() => handleAssign(room._id, "none")}
                                            className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/10 active:scale-95 transition-all"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {room.occupantName && (
                                    <div className="mt-4 flex items-center space-x-2.5 p-3 rounded-xl bg-primary/5 text-primary border border-primary/10">
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-bold">Assigned to {room.occupantName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`absolute bottom-0 left-0 right-0 h-2 transition-colors ${room.status === 'occupied' ? 'bg-primary' :
                            room.status === 'maintenance' ? 'bg-destructive' :
                                'bg-muted'
                            }`} />
                    </div>
                ))}
            </div>

            {rooms.length === 0 && (
                <div className="p-32 text-center bg-muted/20 border-2 border-dashed rounded-3xl">
                    <Bed className="w-12 h-12 text-muted-foreground/20 mx-auto mb-6" />
                    <p className="text-muted-foreground/40 font-bold text-sm tracking-widest uppercase italic">Infrastructure required</p>
                </div>
            )}
        </div>
    )
}
