import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const create = mutation({
    args: {
        userId: v.id("users"),
        type: v.string(),
        roomNumber: v.string(),
        description: v.string(),
        priority: v.string(),
        image: v.optional(v.string()),
        staffId: v.optional(v.id("users")),
        
        // New fields
        category: v.optional(v.string()),
        subCategory: v.optional(v.string()),
        applianceModel: v.optional(v.string()),
        dateNoticed: v.optional(v.string()),
        specialAttention: v.optional(v.boolean()),
        accessPreference: v.optional(v.string()),
        laundryItems: v.optional(v.array(v.object({
            name: v.string(),
            quantity: v.number(),
            type: v.string(),
        }))),
        starch: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (user) {
            await ctx.db.patch(args.userId, {
                points: (user.points ?? 0) + 50
            });
        }

        const requestId = await ctx.db.insert("requests", {
            ...args,
            status: "pending",
            createdAt: Date.now(),
        });

        // Map request types to duty types
        const typeDutyMap: Record<string, string> = {
            "housekeeping": "housekeeping",
            "maintenance": "maintenance",
            "laundry": "laundry",
            "room_service": "room_service",
            "delivery": "delivery"
        };

        const dutyType = typeDutyMap[args.type.toLowerCase()] || args.type.toLowerCase();

        let assignedStaffId: any = args.staffId;

        // If no staff explicitly chosen, pick a vacant matching staffer
        if (!assignedStaffId) {
            const allStaff = await ctx.db
                .query("users")
                .withIndex("by_role", (q) => q.eq("role", "camp-staff"))
                .collect();

            const availableStaff = allStaff.filter(staff => {
                const duties = staff.assignedDuties || [];
                const hasMatchingDuty = duties.includes(dutyType);
                const isVacant = !staff.currentTaskId; // No current task means vacant
                return hasMatchingDuty && isVacant;
            });

            if (availableStaff.length > 0) {
                assignedStaffId = availableStaff[0]._id;
            }
        }

        // Create tasks/assignment
        const assignmentId = await ctx.db.insert("tasks", {
            staffId: assignedStaffId,
            requestId,
            roomNumber: args.roomNumber,
            serviceType: dutyType,
            description: args.description,
            priority: args.priority,
            category: args.category,
            subCategory: args.subCategory,
            applianceModel: args.applianceModel,
            accessPreference: args.accessPreference,
            image: args.image,
            status: "pending", // pending confirmation from staff
            assignedAt: Date.now(),
        });

        // If assigned to specific staff, update their currentTaskId
        if (assignedStaffId) {
            await ctx.db.patch(assignedStaffId, {
                currentTaskId: assignmentId,
            });
        }

        // Notify all camp-staff about the new task (vacant staff will see it on their board)
        const displayType = args.type.charAt(0).toUpperCase() + args.type.slice(1).replace("_", " ");
        await ctx.runMutation(api.notifications.sendRoleNotification, {
            role: "camp-staff",
            assignmentId,
            requestId,
            type: "assignment",
            message: `New ${displayType} Request: ${args.roomNumber} - ${args.category ? `[${args.category}${args.subCategory ? ` / ${args.subCategory}` : ""}] ` : ""}${args.description}`,
        });

        // Trigger email processing immediately (don't wait for cron)
        await ctx.scheduler.runAfter(0, internal.email.processEmailNotifications, {});

        return requestId;
    },
});

export const listForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const requests = await ctx.db
            .query("requests")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        return Promise.all(
            requests.map(async (r) => {
                let imageUrl = null;
                if (r.image) {
                    try {
                        imageUrl = await ctx.storage.getUrl(r.image);
                    } catch (e) {
                        imageUrl = null;
                    }
                }
                return { ...r, imageUrl };
            })
        );
    },
});

export const list = query({
    args: { status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const baseQuery = args.status && args.status !== "all"
            ? ctx.db.query("requests").withIndex("by_status", (q) => q.eq("status", args.status!))
            : ctx.db.query("requests");

        const requests = await baseQuery.order("desc").collect();

        return Promise.all(
            requests.map(async (r) => {
                let userName = "Unknown";
                const user = await ctx.db.get(r.userId);
                if (user) userName = user.name;

                let imageUrl = null;
                if (r.image) {
                    try {
                        imageUrl = await ctx.storage.getUrl(r.image);
                    } catch (e) {
                        imageUrl = null;
                    }
                }
                return { ...r, userName, imageUrl };
            })
        );
    },
});

export const updateStatus = mutation({
    args: { id: v.id("requests"), status: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const remove = mutation({
    args: { id: v.id("requests") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
export const updateOfficeUse = mutation({
    args: {
        id: v.id("requests"),
        urgency: v.optional(v.string()),
        tradesperson: v.optional(v.string()),
        workOrderSent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...officeUseFields } = args;
        const request = await ctx.db.get(id);
        if (!request) throw new Error("Request not found");

        await ctx.db.patch(id, {
            officeUse: {
                ...(request.officeUse || {}),
                ...officeUseFields,
            },
            // If urgency is set, also update the main priority field for compatibility
            ...(args.urgency ? { priority: args.urgency } : {}),
        });
    },
});
