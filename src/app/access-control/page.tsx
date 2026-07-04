"use client"

import { useMutation } from "convex/react"
import { useQuery } from "convex-helpers/react/cache"
import { ShieldCheck } from "lucide-react"

import { Card } from "@/components/ui/card"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

type AccessUser = {
  _id: Id<"users">
  name: string
  role?: string
  isOnSite?: boolean
  lastAccessScan?: number
}

export default function AccessControlPage() {
  const users = (useQuery(api.users.listAll) ?? []) as AccessUser[]
  const updateAccess = useMutation(api.users.updateAccessControl)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
        <p className="mt-1 text-sm text-muted-foreground">Turn scans on or off when someone is not on site.</p>
      </header>

      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user._id} className="flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`h-5 w-5 ${user.isOnSite ? "text-emerald-600" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role || "user"} | Last scan {user.lastAccessScan ? new Date(user.lastAccessScan).toLocaleString() : "never"}</p>
              </div>
            </div>
            <button
              onClick={() => updateAccess({ userId: user._id, isOnSite: !user.isOnSite, location: "admin" })}
              className={`rounded-xl px-3 py-2 text-xs font-bold ${user.isOnSite ? "border" : "bg-primary text-primary-foreground"}`}
            >
              {user.isOnSite ? "Scan Off Site" : "Scan On Site"}
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
