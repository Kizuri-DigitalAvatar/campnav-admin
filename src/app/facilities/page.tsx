"use client"

import { useMutation, useQuery } from "convex/react"
import { Dumbbell } from "lucide-react"

import { Card } from "@/components/ui/card"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

type FacilityBooking = {
  _id: Id<"facilityBookings">
  facility: string
  userName: string
  date: number
  startTime: string
  endTime: string
  status: string
}

export default function FacilitiesAdminPage() {
  const bookings = (useQuery(api.facilities.getFacilityBookings, {}) ?? []) as FacilityBooking[]
  const stats = useQuery(api.facilities.getFacilityStats, {})
  const updateStatus = useMutation(api.facilities.updateFacilityBookingStatus)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Facilities & Recreation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gym, mini golf, and tennis booking approvals.</p>
      </header>

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
    </div>
  )
}
