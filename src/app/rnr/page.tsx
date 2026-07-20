"use client"

import { FormEvent, useMemo, useState } from "react"
import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { CalendarClock, Plane, Plus } from "lucide-react"

import { Card } from "@/components/ui/card"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

type RnRRequest = {
  _id: Id<"rnrRequests">
  userName: string
  type: string
  startDate: number
  endDate: number
  reason: string
  status: string
}

type AdminUser = {
  _id: Id<"users">
  name: string
  email: string
  role?: string
  department?: string
  userSubcategory?: string
}

export default function RnRAdminPage() {
  const requests = (useQuery(api.rnr.getRnRRequests, {}) ?? []) as RnRRequest[]
  const stats = useQuery(api.rnr.getRnRStats, {}) 
  const createRequest = useMutation(api.rnr.createRnRRequest)
  const approve = useMutation(api.rnr.approveRnRRequest)
  const reject = useMutation(api.rnr.rejectRnRRequest)
  const rawUsers = useQuery(api.users.listAll) as AdminUser[] | undefined
  const users = useMemo(() => rawUsers ?? [], [rawUsers])
  const approverId = users[0]?._id

  const [userId, setUserId] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users
    const query = userSearch.toLowerCase()
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.role || "").toLowerCase().includes(query)
    )
  }, [users, userSearch])

  const [type, setType] = useState("leave")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [bookingReference, setBookingReference] = useState("")
  const [departure, setDeparture] = useState("")
  const [arrival, setArrival] = useState("")
  const [airline, setAirline] = useState("")
  const [confirmationCode, setConfirmationCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreateRequest(event: FormEvent) {
    event.preventDefault()
    if (!userId || !startDate || !endDate || !reason.trim()) return

    setIsSubmitting(true)
    try {
      await createRequest({
        userId: userId as Id<"users">,
        type,
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
        reason: reason.trim(),
        flightDetails: type === "flight"
          ? {
              bookingReference: bookingReference.trim(),
              departure: departure.trim(),
              arrival: arrival.trim(),
              airline: airline.trim(),
              confirmationCode: confirmationCode.trim(),
            }
          : undefined,
      })

      setUserId("")
      setUserSearch("")
      setType("leave")
      setStartDate("")
      setEndDate("")
      setReason("")
      setBookingReference("")
      setDeparture("")
      setArrival("")
      setAirline("")
      setConfirmationCode("")
    } catch (error) {
      console.error("Failed to create RnR request:", error)
      alert("Error creating RnR request. Check console.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">RnR / Leave</h1>
        <p className="mt-1 text-sm text-muted-foreground">Flight itineraries, approvals, and 7-day countdown visibility.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Pending", stats?.pendingRequests ?? 0],
          ["Approved", stats?.approvedRequests ?? 0],
          ["Upcoming flights", stats?.upcomingFlights ?? 0],
          ["Active leave", stats?.activeLeave ?? 0],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl p-5 md:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Create RnR Request</h2>
            <p className="text-xs text-muted-foreground">Add leave, flight, or accommodation records for staff and employees.</p>
          </div>
        </div>

        <form onSubmit={handleCreateRequest} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2 xl:col-span-2 relative">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User / Employee</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search user by name, email, role..."
                value={userSearch}
                onFocus={() => setShowUserDropdown(true)}
                onBlur={() => {
                  // Delay closing so click option handler registers first
                  setTimeout(() => setShowUserDropdown(false), 200)
                }}
                onChange={(e) => {
                  setUserSearch(e.target.value)
                  const selected = users.find(u => u.name.toLowerCase() === e.target.value.toLowerCase())
                  if (selected) {
                    setUserId(selected._id)
                  } else {
                    setUserId("")
                  }
                }}
                className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                required
              />
              {userId && (
                <button
                  type="button"
                  onClick={() => {
                    setUserId("")
                    setUserSearch("")
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer border-none bg-transparent"
                >
                  Clear
                </button>
              )}
            </div>
            {showUserDropdown && (
              <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-md p-1 font-sans">
                {filteredUsers.length === 0 ? (
                  <div className="px-4 py-2 text-xs text-muted-foreground">No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      onMouseDown={() => {
                        setUserId(user._id)
                        setUserSearch(user.name)
                        setShowUserDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent hover:text-accent-foreground flex items-center justify-between cursor-pointer border-none bg-transparent font-sans"
                    >
                      <span className="font-medium text-foreground">{user.name}</span>
                      <span className="text-[10px] opacity-75 font-mono text-muted-foreground">
                        {(user.role || "user").replace("_", " ").toUpperCase()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request Type</label>
            <select
              className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-bold"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="leave">Leave</option>
              <option value="flight">Flight</option>
              <option value="accommodation">Accommodation</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start Date</label>
            <input
              className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-bold"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Date</label>
            <input
              className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-bold"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              min={startDate || undefined}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reason / Notes</label>
            <input
              className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-bold"
              placeholder="Annual leave, rotation travel, lodging support..."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </div>

          {type === "flight" && (
            <div className="grid gap-5 md:col-span-2 md:grid-cols-2 xl:col-span-4 xl:grid-cols-5">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Booking Ref</label>
                <input
                  className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-bold"
                  value={bookingReference}
                  onChange={(event) => setBookingReference(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Departure</label>
                <input
                  className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-bold"
                  placeholder="FNA"
                  value={departure}
                  onChange={(event) => setDeparture(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Arrival</label>
                <input
                  className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-bold"
                  placeholder="ACC"
                  value={arrival}
                  onChange={(event) => setArrival(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Airline</label>
                <input
                  className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-bold"
                  value={airline}
                  onChange={(event) => setAirline(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirm Code</label>
                <input
                  className="h-11 w-full rounded-xl border bg-muted/50 px-4 text-sm outline-none transition-all focus:bg-background focus:ring-2 focus:ring-primary/20 font-bold"
                  value={confirmationCode}
                  onChange={(event) => setConfirmationCode(event.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              disabled={isSubmitting || users.length === 0}
              className="h-11 rounded-xl bg-primary px-6 text-xs font-black uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer font-bold"
            >
              {isSubmitting ? "Creating..." : "Create RnR"}
            </button>
          </div>
        </form>
      </Card>

      <div className="grid gap-3">
        {requests.map((request) => {
          const days = Math.ceil((request.startDate - Date.now()) / (24 * 60 * 60 * 1000))
          return (
            <Card key={request._id} className="flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                {request.type === "flight" ? <Plane className="h-5 w-5 text-primary" /> : <CalendarClock className="h-5 w-5 text-primary" />}
                <div>
                  <p className="text-sm font-bold">{request.userName} - {request.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} | {days} days | {request.status}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{request.reason}</p>
                </div>
              </div>
              {request.status === "pending" && approverId && (
                <div className="flex gap-2">
                  <button onClick={() => reject({ requestId: request._id, approvedBy: approverId, reason: "Declined by admin" })} className="rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer">Reject</button>
                  <button onClick={() => approve({ requestId: request._id, approvedBy: approverId })} className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground cursor-pointer">Approve</button>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
