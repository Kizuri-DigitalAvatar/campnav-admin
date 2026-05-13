import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const assign = mutation({
    args: {
        staffId: v.id("users"),
        roomNumber: v.string(),
        serviceType: v.string(),
        description: v.optional(v.string()),
        priority: v.optional(v.string()),
        category: v.optional(v.string()),
        subCategory: v.optional(v.string()),
        applianceModel: v.optional(v.string()),
        accessPreference: v.optional(v.string()),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("tasks", {
            staffId: args.staffId,
            roomNumber: args.roomNumber,
            serviceType: args.serviceType,
            description: args.description,
            priority: args.priority,
            category: args.category,
            subCategory: args.subCategory,
            applianceModel: args.applianceModel,
            accessPreference: args.accessPreference,
            image: args.image,
            status: "pending",
            assignedAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: { id: v.id("tasks"), status: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const remove = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) return;

        // If assigned to a staff, clear their currentTaskId
        if (assignment.staffId) {
            const staff = await ctx.db.get(assignment.staffId);
            if (staff && staff.currentTaskId === assignment._id) {
                await ctx.db.patch(assignment.staffId, {
                    currentTaskId: undefined,
                });
            }
        }
        await ctx.db.delete(args.id);
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const assignments = await ctx.db.query("tasks").order("desc").collect();
        return Promise.all(
            assignments.map(async (a) => {
                let staffName = "Unknown";
                if (a.staffId) {
                    try {
                        const staff = await ctx.db.get(a.staffId);
                        if (staff) {
                            staffName = staff.name;
                        }
                    } catch (e) {
                        console.error("Failed to fetch staff member", a._id, a.staffId, e);
                    }
                }
                // Get associated request details if any
                let requestDetails = null;
                if (a.requestId) {
                    const req = await ctx.db.get(a.requestId);
                    if (req) {
                        let imageUrl = null;
                        if (req.image) {
                            try { imageUrl = await ctx.storage.getUrl(req.image); } catch (e) { }
                        }
                        requestDetails = {
                            description: req.description,
                            priority: req.priority,
                            imageUrl,
                            category: req.category,
                            subCategory: req.subCategory,
                            accessPreference: req.accessPreference,
                            applianceModel: req.applianceModel,
                        };
                    }
                } else {
                    // Use fields on the assignment itself (manual admin-created task)
                    let imageUrl = null;
                    if (a.image) {
                        try { imageUrl = await ctx.storage.getUrl(a.image); } catch (e) { }
                    }
                    requestDetails = {
                        description: a.description,
                        priority: a.priority,
                        imageUrl,
                        category: a.category,
                        subCategory: a.subCategory,
                        accessPreference: a.accessPreference,
                        applianceModel: a.applianceModel,
                    };
                }

                return { ...a, staffName, requestDetails };
            })
        );
    },
});

// Get assignments for a specific worker
export const getWorkerAssignments = query({
    args: { workerId: v.id("users") },
    handler: async (ctx, args) => {
        // Get tasks assigned explicitly to this worker
        const assignedTasks = await ctx.db
            .query("tasks")
            .withIndex("by_staffId", (q) => q.eq("staffId", args.workerId))
            .collect();

        // Also get unassigned tasks that are pending
        const unassignedTasks = await ctx.db
            .query("tasks")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const filteredUnassigned = unassignedTasks.filter(t => !t.staffId);

        // Combine and sort by assignedAt
        const allTasks = [...assignedTasks, ...filteredUnassigned].sort((a, b) => b.assignedAt - a.assignedAt);

        return Promise.all(
            allTasks.map(async (a) => {
                // Get associated request details if any
                let requestDetails = null;
                if (a.requestId) {
                    const req = await ctx.db.get(a.requestId);
                    if (req) {
                        let imageUrl = null;
                        if (req.image) {
                            try {
                                imageUrl = await ctx.storage.getUrl(req.image);
                            } catch (e) {
                                imageUrl = null;
                            }
                        }
                        requestDetails = {
                            description: req.description,
                            priority: req.priority,
                            imageUrl
                        };
                    }
                }

                return { ...a, requestDetails };
            })
        );
    },
});

// Worker acknowledges assignment or picks up unassigned task
export const acknowledgeAssignment = mutation({
    args: { id: v.id("tasks"), staffId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const patch: any = {
            status: "acknowledged",
            acknowledgedAt: Date.now(),
        };
        if (args.staffId) {
            patch.staffId = args.staffId;
            // Mark staff as busy
            await ctx.db.patch(args.staffId, {
                currentTaskId: args.id,
            });
        }
        await ctx.db.patch(args.id, patch);

        // Update associated request status to in_progress
        const assignment = await ctx.db.get(args.id);
        if (assignment?.requestId) {
            await ctx.db.patch(assignment.requestId, { status: "in_progress" });
        }
    },
});

// Worker starts assignment
export const startAssignment = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        await ctx.db.patch(args.id, {
            status: "in_progress",
            startedAt: Date.now(),
        });
        if (task?.requestId) {
            await ctx.db.patch(task.requestId, { status: "in_progress" });
        }
    },
});

// Camp-staff confirms they accept the task
export const confirmTask = mutation({
    args: { id: v.id("tasks"), staffId: v.id("users") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.id, {
            status: "confirmed",
            staffConfirmedAt: Date.now(),
        });

        // Update associated request status to in_progress
        if (assignment.requestId) {
            await ctx.db.patch(assignment.requestId, { status: "in_progress" });
        }

        // Update staff's currentTaskId to mark them as busy
        await ctx.db.patch(args.staffId, {
            currentTaskId: args.id,
        });
    },
});

// Camp-staff marks task as completed
export const completeTask = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.id, {
            status: "completed",
            completedAt: Date.now(),
        });

        // Update associated request status
        if (assignment.requestId) {
            await ctx.db.patch(assignment.requestId, {
                status: "completed",
            });
        }

        // Free up the staff member so they can take new tasks
        if (assignment.staffId) {
            await ctx.db.patch(assignment.staffId, {
                currentTaskId: undefined,
            });
        }
    },
});

// Camper confirms completion
export const camperConfirmCompletion = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.id, {
            camperConfirmedAt: Date.now(),
        });

        // Free up the staff member
        if (assignment.staffId) {
            await ctx.db.patch(assignment.staffId, {
                currentTaskId: undefined,
            });
        }

        // Update associated request status
        if (assignment.requestId) {
            await ctx.db.patch(assignment.requestId, {
                status: "completed",
            });
        }
    },
});

// Camper rates the completed task
export const rateTask = mutation({
    args: {
        id: v.id("tasks"),
        rating: v.number(), // 1-5
        feedback: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");
        if (!assignment.camperConfirmedAt) {
            throw new Error("Task must be confirmed by camper before rating");
        }

        await ctx.db.patch(args.id, {
            rating: args.rating,
            feedback: args.feedback,
            status: "rated",
        });
    },
});

// Get average rating for a camp-staff member
export const getStaffRating = query({
    args: { staffId: v.id("users") },
    handler: async (ctx, args) => {
        const tasks = await ctx.db
            .query("tasks")
            .withIndex("by_staffId", (q) => q.eq("staffId", args.staffId))
            .collect();

        const ratedTasks = tasks.filter(t => t.rating !== undefined);
        if (ratedTasks.length === 0) {
            return { averageRating: 0, totalRatings: 0 };
        }

        const sum = ratedTasks.reduce((acc, t) => acc + (t.rating || 0), 0);
        const averageRating = sum / ratedTasks.length;

        return {
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            totalRatings: ratedTasks.length,
        };
    },
});
