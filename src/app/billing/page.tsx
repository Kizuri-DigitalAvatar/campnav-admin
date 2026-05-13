"use client"

import { FormEvent, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { CreditCard, Plus } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

type BillingUser = {
  _id: Id<"users">
  name: string
}

type Invoice = {
  _id: Id<"invoices">
  invoiceNumber: string
  userName: string
  period: string
  total: number
  status: string
}

export default function BillingPage() {
  const users = (useQuery(api.users.listAll) ?? []) as BillingUser[]
  const invoices = (useQuery(api.billing.getInvoices, {}) ?? []) as Invoice[]
  const stats = useQuery(api.billing.getBillingStats, {})
  const createInvoice = useMutation(api.billing.createInvoice)
  const updateStatus = useMutation(api.billing.updateInvoiceStatus)

  const [userId, setUserId] = useState<Id<"users"> | "">("")
  const [period, setPeriod] = useState("monthly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [description, setDescription] = useState("Accommodation cost per head")
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!userId || !startDate || !endDate || !description.trim()) return

    await createInvoice({
      userId,
      period,
      startDate: new Date(startDate).getTime(),
      endDate: new Date(endDate).getTime(),
      items: [{
        description: description.trim(),
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      }],
    })
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Finance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invoices, cost-per-head, and POS/card payment tracking.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total invoices", stats?.totalInvoices ?? 0],
          ["Paid", stats?.paidInvoices ?? 0],
          ["Outstanding", `Le ${(stats?.outstandingRevenue ?? 0).toLocaleString()}`],
          ["Cost per head", `Le ${(stats?.costPerHead ?? 0).toLocaleString()}`],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl p-5">
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-6 md:items-end">
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</label>
            <select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={userId} onChange={(e) => setUserId(e.target.value as Id<"users"> | "")}>
              <option value="">Select user</option>
              {users.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
            </select>
          </div>
          <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground">
            <Plus className="h-4 w-4" />
            Create
          </button>
          <Input className="md:col-span-2" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <Input type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
        </form>
      </Card>

      <div className="grid gap-3">
        {invoices.map((invoice) => (
          <Card key={invoice._id} className="flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold">{invoice.invoiceNumber} - {invoice.userName}</p>
              <p className="text-xs text-muted-foreground">{invoice.period} | Le {invoice.total.toLocaleString()} | {invoice.status}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateStatus({ invoiceId: invoice._id, status: "sent" })} className="rounded-xl border px-3 py-2 text-xs font-bold">Send</button>
              <button onClick={() => updateStatus({ invoiceId: invoice._id, status: "paid", paymentMethod: "card" })} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                <CreditCard className="h-3 w-3" />
                Card/POS Paid
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
