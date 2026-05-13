"use client"

import { useMutation, useQuery } from "convex/react"
import { ChefHat } from "lucide-react"

import { Card } from "@/components/ui/card"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"

type MealOrder = {
  _id: Id<"mealOrders">
  userName: string
  mealType: string
  date: number
  status: string
  preferences?: {
    riceType: string
    spiceLevel: string
  }
}

type InventoryItem = {
  name: string
  mealType: string
  totalQuantity: number
}

export default function MealsAdminPage() {
  const orders = (useQuery(api.meals.getMealOrders, {}) ?? []) as MealOrder[]
  const stats = useQuery(api.meals.getMealStats, {})
  const inventory = (useQuery(api.meals.getMealInventoryRequirements, { date: new Date().setHours(0, 0, 0, 0) }) ?? []) as InventoryItem[]
  const updateStatus = useMutation(api.meals.updateMealOrderStatus)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Meal Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pre-orders, dietary preferences, and inventory requirements.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total", stats?.totalOrders ?? 0],
          ["Breakfast", stats?.byMealType?.breakfast ?? 0],
          ["Lunch", stats?.byMealType?.lunch ?? 0],
          ["Dinner", stats?.byMealType?.dinner ?? 0],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold"><ChefHat className="h-4 w-4" /> Inventory link for today</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {inventory.map((item) => (
            <div key={`${item.name}-${item.mealType}`} className="rounded-xl border p-3 text-xs">
              <p className="font-bold">{item.name}</p>
              <p className="text-muted-foreground">{item.mealType} | Qty {item.totalQuantity}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3">
        {orders.map((order) => (
          <Card key={order._id} className="flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold">{order.userName} - {order.mealType}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleDateString()} | {order.preferences?.riceType} | {order.preferences?.spiceLevel}</p>
            </div>
            <select className="h-9 rounded-xl border bg-background px-3 text-xs" value={order.status} onChange={(e) => updateStatus({ orderId: order._id, status: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </Card>
        ))}
      </div>
    </div>
  )
}
