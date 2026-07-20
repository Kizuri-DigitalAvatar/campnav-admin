"use client"

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";

// Toasts new notifications for the logged-in admin the moment they arrive
export function AdminNotificationListener({ userId }: { userId?: string }) {
    const router = useRouter();
    const pending = useQuery(
        api.notifications.getMyPendingNotifications,
        userId ? { userId: userId as any } : "skip"
    );
    const markDelivered = useMutation(api.notifications.markNotificationDelivered);
    const seenRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!pending) return;
        pending
            .filter((n: any) => n.channel === "push")
            .forEach((n: any) => {
                if (seenRef.current.has(n._id)) return;
                seenRef.current.add(n._id);

                const title =
                    n.type === "support" ? "New Support Message" :
                    n.type === "admin_alert" ? "Action Needed" :
                    n.type === "room_assignment" ? "Room Assignment" :
                    n.type === "emergency" ? "Emergency Alert" :
                    "Notification";

                toast(title, {
                    description: n.message,
                    action: {
                        label: "View",
                        onClick: () => router.push(
                            n.type === "support" ? "/reports" :
                            n.type === "room_assignment" ? "/room-management" :
                            "/requests"
                        ),
                    },
                });

                markDelivered({ id: n._id, status: "delivered" }).catch(console.error);
            });
    }, [pending, markDelivered, router]);

    return null;
}
