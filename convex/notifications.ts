import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Role names have drifted over time; expand a role to all its aliases
const ROLE_ALIASES: Record<string, string[]> = {
    "camp-staff": ["camp-staff", "staff"],
    "staff": ["camp-staff", "staff"],
    "camper": ["camper", "visitor", "resident"],
    "visitor": ["camper", "visitor", "resident"],
    "resident": ["camper", "visitor", "resident"],
    "admin": ["admin", "camp_manager", "camp_supervisor"],
};

// Send notification to all users with a specific role
export const sendRoleNotification = mutation({
    args: {
        role: v.string(),
        assignmentId: v.optional(v.id("tasks")),
        requestId: v.optional(v.id("requests")),
        type: v.string(), // "assignment", "reminder", "general"
        message: v.string(),
        link: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Find all users with this role (including alias role names)
        const roles = ROLE_ALIASES[args.role] || [args.role];
        const users = (await Promise.all(
            roles.map((role) =>
                ctx.db
                    .query("users")
                    .withIndex("by_role", (q) => q.eq("role", role))
                    .collect()
            )
        )).flat();

        const notifications = [];

        for (const user of users) {
            const prefs = user.notificationPreferences || { push: true, email: true, sms: true };

            if (prefs.push) {
                notifications.push(
                    ctx.db.insert("notifications", {
                        userId: user._id,
                        assignmentId: args.assignmentId,
                        requestId: args.requestId,
                        type: args.type,
                        channel: "push",
                        status: "pending",
                        message: args.message,
                        link: args.link,
                    })
                );
            }

            if (prefs.email && user.email) {
                notifications.push(
                    ctx.db.insert("notifications", {
                        userId: user._id,
                        assignmentId: args.assignmentId,
                        requestId: args.requestId,
                        type: args.type,
                        channel: "email",
                        status: "pending",
                        message: args.message,
                        link: args.link,
                    })
                );
            }

            if (prefs.sms && user.phoneNumber) {
                notifications.push(
                    ctx.db.insert("notifications", {
                        userId: user._id,
                        assignmentId: args.assignmentId,
                        requestId: args.requestId,
                        type: args.type,
                        channel: "sms",
                        status: "pending",
                        message: args.message,
                        link: args.link,
                    })
                );
            }
        }

        await Promise.all(notifications);
    },
});

// Send notification for new assignment
export const sendAssignmentNotification = mutation({
    args: {
        userId: v.id("users"),
        assignmentId: v.id("tasks"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const prefs = user.notificationPreferences || { push: true, email: true, sms: true };
        const notifications = [];

        // Create notification records for each enabled channel
        if (prefs.push) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "assignment",
                    channel: "push",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.email && user.email) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "assignment",
                    channel: "email",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.sms && user.phoneNumber) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "assignment",
                    channel: "sms",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        await Promise.all(notifications);
    },
});

export const sendCamperNotification = mutation({
    args: {
        userId: v.id("users"),
        assignmentId: v.optional(v.id("tasks")),
        requestId: v.optional(v.id("requests")),
        type: v.string(), // "acceptance", "completion", "escalation"
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) {
            console.warn(
                `[sendCamperNotification] Skipping notification for missing user ${args.userId}`
            );
            return;
        }

        const prefs = user.notificationPreferences || { push: true, email: true, sms: true };
        const notifications = [];

        if (prefs.push) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    requestId: args.requestId,
                    type: args.type,
                    channel: "push",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.email && user.email) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    requestId: args.requestId,
                    type: args.type,
                    channel: "email",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        await Promise.all(notifications);
    },
});

// Send reminder notification
export const sendReminderNotification = mutation({
    args: {
        userId: v.id("users"),
        assignmentId: v.id("tasks"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment) throw new Error("Assignment not found");

        const prefs = user.notificationPreferences || { push: true, email: true, sms: true };

        // Update assignment reminder tracking
        await ctx.db.patch(args.assignmentId, {
            lastReminderSent: Date.now(),
            reminderCount: (assignment.reminderCount || 0) + 1,
        });

        // Send notifications based on preferences
        const notifications = [];

        if (prefs.push) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "reminder",
                    channel: "push",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.email && user.email) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "reminder",
                    channel: "email",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        if (prefs.sms && user.phoneNumber) {
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: args.userId,
                    assignmentId: args.assignmentId,
                    type: "reminder",
                    channel: "sms",
                    status: "pending",
                    message: args.message,
                })
            );
        }

        await Promise.all(notifications);
    },
});

// Notify admin about unresponsive worker
export const notifyAdminUnresponsive = mutation({
    args: {
        assignmentId: v.id("tasks"),
        requestId: v.optional(v.id("requests")),
        workerName: v.optional(v.string()),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        // Get all admin users (including camp managers / supervisors)
        const admins = (await Promise.all(
            ROLE_ALIASES.admin.map((role) =>
                ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", role)).collect()
            )
        )).flat();

        const notifications = [];

        for (const admin of admins) {
            // Send push and email to admins
            notifications.push(
                ctx.db.insert("notifications", {
                    userId: admin._id,
                    assignmentId: args.assignmentId,
                    requestId: args.requestId,
                    type: "admin_alert",
                    channel: "push",
                    status: "pending",
                    message: args.message,
                })
            );

            if (admin.email) {
                notifications.push(
                    ctx.db.insert("notifications", {
                        userId: admin._id,
                        assignmentId: args.assignmentId,
                        requestId: args.requestId,
                        type: "admin_alert",
                        channel: "email",
                        status: "pending",
                        message: args.message,
                    })
                );
            }
        }

        await Promise.all(notifications);
    },
});

// Mark notification as delivered
export const markNotificationDelivered = mutation({
    args: {
        id: v.id("notifications"),
        status: v.string(), // "sent", "delivered", "failed"
    },
    handler: async (ctx, args) => {
        const update: any = { status: args.status };

        if (args.status === "sent") {
            update.sentAt = Date.now();
        } else if (args.status === "delivered") {
            update.deliveredAt = Date.now();
        }

        await ctx.db.patch(args.id, update);
    },
});

// Get notification history for an assignment
export const getNotificationHistory = query({
    args: { assignmentId: v.id("tasks") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notifications")
            .withIndex("by_assignmentId", (q) => q.eq("assignmentId", args.assignmentId))
            .order("desc")
            .collect();
    },
});

// In-app notification feed for the bell popup (push channel only, newest first)
export const getForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
        return notifications
            .filter((n) => n.channel === "push")
            .slice(0, 50);
    },
});

// Unread count for the bell badge
export const getUnreadCount = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();
        return notifications.filter((n) => n.channel === "push" && !n.readAt).length;
    },
});

// Mark all of a user's in-app notifications as read (called when the popup opens)
export const markAllRead = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = (await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect()
        ).filter((n) => n.channel === "push" && !n.readAt);
        await Promise.all(unread.map((n) => ctx.db.patch(n._id, { readAt: Date.now() })));
    },
});

// Get pending notifications for a specific user (push channel only — used by the client toast listener)
export const getMyPendingNotifications = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notifications")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "pending"),
                    q.eq(q.field("channel"), "push")
                )
            )
            .collect();
    },
});

// Get unresponsive workers (assignments pending >5 min without acknowledgment)
export const getUnresponsiveWorkers = query({
    args: {},
    handler: async (ctx) => {
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

        const assignments = await ctx.db
            .query("tasks")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const unresponsive = assignments.filter(
            (a) => a.assignedAt < tenMinutesAgo && !a.acknowledgedAt
        );

        return Promise.all(
            unresponsive.map(async (a: any) => {
                const worker = a.staffId ? await ctx.db.get(a.staffId) : null;
                const workerData = worker as any;
                return {
                    ...a,
                    workerName: workerData?.name || "Unassigned",
                    workerEmail: workerData?.email,
                };
            })
        );
    },
});

// Get pending notifications that need to be sent
export const getPendingNotifications = query({
    args: {},
    handler: async (ctx) => {
        const pending = await ctx.db
            .query("notifications")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        return Promise.all(
            pending.map(async (n) => {
                const user = await ctx.db.get(n.userId);
                const userData = user as any;
                return {
                    ...n,
                    userEmail: userData?.email,
                    userPhone: userData?.phoneNumber,
                    userRole: userData?.role,
                };
            })
        );
    },
});

// Internal mutation to mark notification as sent/failed
export const updateNotificationStatus = internalMutation({
    args: {
        id: v.id("notifications"),
        status: v.string(), // "sent", "failed"
        error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: args.status,
            sentAt: args.status === "sent" ? Date.now() : undefined,
        });
    },
});

// Kept for existing callers; all email goes through email.processEmailNotifications
export const processEmailNotifications = action({
    args: {},
    handler: async (ctx) => {
        await ctx.runAction(internal.email.processEmailNotifications, {});
    },
});

// Mark an email as being sent so overlapping sender runs don't send it twice
export const claimEmailNotification = internalMutation({
    args: { id: v.id("notifications") },
    handler: async (ctx, args) => {
        const notif = await ctx.db.get(args.id);
        if (!notif || notif.status !== "pending") return false;
        await ctx.db.patch(args.id, { status: "sending" });
        return true;
    },
});

// Drop queued emails created before a cutoff, e.g. a backlog built up while
// sending was switched off. npx convex run notifications:expirePendingEmails
export const expirePendingEmails = internalMutation({
    args: { before: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const before = args.before ?? Date.now();
        const pending = await ctx.db
            .query("notifications")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
        let expired = 0;
        for (const n of pending) {
            if (n.channel === "email" && n._creationTime < before) {
                await ctx.db.patch(n._id, { status: "failed" });
                expired++;
            }
        }
        return expired;
    },
});
