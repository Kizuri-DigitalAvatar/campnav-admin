"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@convex/_generated/api";
import { AlertTriangle, Bell, Calendar, ClipboardList, Clock, Megaphone, MessageSquare } from "lucide-react";

function timeAgo(timestamp: number) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function typeMeta(type: string) {
    switch (type) {
        case "admin_alert": return { icon: AlertTriangle, label: "Action Needed" };
        case "support": return { icon: MessageSquare, label: "Support Message" };
        case "reminder": return { icon: Clock, label: "Reminder" };
        case "assignment": return { icon: ClipboardList, label: "Assignment" };
        case "announcement": return { icon: Megaphone, label: "Announcement" };
        case "activity": return { icon: Calendar, label: "Event" };
        default: return { icon: Bell, label: "Notification" };
    }
}

export function AdminNotificationBell({ userId }: { userId?: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const markedRef = useRef(false);

    const unreadCount = useQuery(api.notifications.getUnreadCount, userId ? { userId: userId as any } : "skip");
    const notifications = useQuery(
        api.notifications.getForUser,
        open && userId ? { userId: userId as any } : "skip"
    );
    const markAllRead = useMutation(api.notifications.markAllRead);

    useEffect(() => {
        if (open && userId && !markedRef.current) {
            markedRef.current = true;
            markAllRead({ userId: userId as any }).catch(console.error);
        }
        if (!open) markedRef.current = false;
    }, [open, userId, markAllRead]);

    if (!userId) return null;

    const handleClick = (n: any) => {
        setOpen(false);
        router.push(n.type === "support" ? "/reports" : "/requests");
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative h-10 w-10 rounded-xl border bg-card flex items-center justify-center hover:border-primary/60 hover:text-primary transition-colors active:scale-95"
                aria-label="Notifications"
            >
                <Bell className="h-4 w-4" />
                {(unreadCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount! > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="fixed md:absolute left-2 right-2 md:left-0 md:right-auto top-16 md:top-12 z-50 md:w-96 bg-background border-2 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b flex items-center justify-between bg-muted/30">
                            <h3 className="text-xs font-black uppercase tracking-widest">Notifications</h3>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto divide-y">
                            {notifications === undefined ? (
                                <div className="p-8 text-center">
                                    <Bell className="h-5 w-5 mx-auto text-muted-foreground/30 animate-pulse" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">No notifications</p>
                                </div>
                            ) : (
                                notifications.map((n: any) => {
                                    const meta = typeMeta(n.type);
                                    const Icon = meta.icon;
                                    const isUnread = !n.readAt;
                                    const isAlert = n.type === "admin_alert";
                                    return (
                                        <button
                                            key={n._id}
                                            type="button"
                                            onClick={() => handleClick(n)}
                                            className={`w-full text-left px-5 py-3.5 flex gap-3 transition-colors hover:bg-muted/40 ${isUnread ? "bg-primary/5" : ""}`}
                                        >
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isAlert ? "bg-destructive/10 text-destructive" : isUnread ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isAlert ? "text-destructive" : "text-primary/70"}`}>
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n._creationTime)}</span>
                                                </div>
                                                <p className={`text-xs mt-0.5 line-clamp-3 ${isUnread ? "font-semibold" : "text-muted-foreground"}`}>{n.message}</p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
