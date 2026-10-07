// Where clicking an admin notification should take you
export function adminNotificationHref(n: { type: string; message?: string; requestId?: string }) {
    if (n.type === "support") return "/reports"
    if (n.type === "room_assignment") return "/room-management"
    if (n.type === "missing_room") return "/users?filter=no-room"
    if (n.type === "preventive") return "/maintenance/preventive"
    // Older menu reminders were sent with the generic "reminder" type
    if (n.type === "menu_reminder" || (n.type === "reminder" && n.message?.includes("weekly meal menu"))) {
        return "/menus?week=next"
    }
    if (n.type === "admin_alert" && n.requestId) return `/requests/${n.requestId}`
    return "/requests"
}
