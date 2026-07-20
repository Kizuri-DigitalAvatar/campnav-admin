import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createRnRRequest = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(), // "leave", "flight", "accommodation"
    startDate: v.number(),
    endDate: v.number(),
    reason: v.string(),
    flightDetails: v.optional(v.object({
      bookingReference: v.string(),
      departure: v.string(),
      arrival: v.string(),
      airline: v.string(),
      confirmationCode: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate countdown days for flight requests
    let countdownDays = undefined;
    if (args.type === "flight") {
      const startDate = new Date(args.startDate);
      const now = new Date();
      const diffTime = startDate.getTime() - now.getTime();
      countdownDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return await ctx.db.insert("rnrRequests", {
      userId: args.userId,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      reason: args.reason,
      flightDetails: args.flightDetails,
      countdownDays,
      status: "pending",
      notificationsSent: [],
      createdAt: Date.now(),
    });
  },
});

export const approveRnRRequest = mutation({
  args: {
    requestId: v.id("rnrRequests"),
    approvedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("RnR request not found");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "approved",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
    });

    const user = await ctx.db.get(request.userId);
    if (user) {
      const prefs = (user as any).notificationPreferences || { push: true, email: true, sms: true };
      const typeLabel = request.type === "flight" ? "Flight" : request.type === "leave" ? "Leave" : "Accommodation";

      // Always notify the requester that their RnR was approved
      if (prefs.push) {
        await ctx.db.insert("notifications", {
          userId: request.userId,
          type: "acceptance",
          channel: "push",
          status: "pending",
          message: `Your ${typeLabel} RnR request has been approved.`,
        });
      }
      if (prefs.email && user.email) {
        await ctx.db.insert("notifications", {
          userId: request.userId,
          type: "acceptance",
          channel: "email",
          status: "pending",
          message: `Your ${typeLabel} RnR request has been approved.`,
        });
      }
      if (prefs.sms && (user as any).phoneNumber) {
        await ctx.db.insert("notifications", {
          userId: request.userId,
          type: "acceptance",
          channel: "sms",
          status: "pending",
          message: `Your ${typeLabel} RnR request has been approved.`,
        });
      }

      // For flight requests close to departure, also send a countdown notification
      if (request.type === "flight" && request.countdownDays && request.countdownDays <= 7) {
        const notifications = ["hod", "camp_hk_kitchen"];
        await ctx.db.patch(args.requestId, {
          notificationsSent: notifications,
        });

        // Countdown reminder goes to the requester (not the approver)
        if (prefs.push) {
          await ctx.db.insert("notifications", {
            userId: request.userId,
            type: "rnr_countdown",
            channel: "push",
            status: "pending",
            message: `Flight RnR countdown: ${request.countdownDays} day${request.countdownDays === 1 ? "" : "s"} until your departure.`,
          });
        }
      }
    }

    return await ctx.db.get(args.requestId);
  },
});

export const rejectRnRRequest = mutation({
  args: {
    requestId: v.id("rnrRequests"),
    approvedBy: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("RnR request not found");
    }

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
    });

    // Notify the requester about rejection
    const user = await ctx.db.get(request.userId);
    if (user) {
      const prefs = (user as any).notificationPreferences || { push: true, email: true, sms: true };
      const typeLabel = request.type === "flight" ? "Flight" : request.type === "leave" ? "Leave" : "Accommodation";
      const message = `Your ${typeLabel} RnR request was not approved${args.reason ? `: ${args.reason}` : "."}`;

      if (prefs.push) {
        await ctx.db.insert("notifications", {
          userId: request.userId,
          type: "update",
          channel: "push",
          status: "pending",
          message,
        });
      }
      if (prefs.email && user.email) {
        await ctx.db.insert("notifications", {
          userId: request.userId,
          type: "update",
          channel: "email",
          status: "pending",
          message,
        });
      }
      if (prefs.sms && (user as any).phoneNumber) {
        await ctx.db.insert("notifications", {
          userId: request.userId,
          type: "update",
          channel: "sms",
          status: "pending",
          message,
        });
      }
    }

    return await ctx.db.get(args.requestId);
  },
});


export const getRnRRequests = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = args.userId
      ? ctx.db.query("rnrRequests").withIndex("by_userId", (q) => q.eq("userId", args.userId!))
      : args.status
        ? ctx.db.query("rnrRequests").withIndex("by_status", (q) => q.eq("status", args.status!))
        : args.type
          ? ctx.db.query("rnrRequests").withIndex("by_type", (q) => q.eq("type", args.type!))
          : ctx.db.query("rnrRequests");

    if (args.userId && args.status) query = query.filter((q) => q.eq(q.field("status"), args.status));
    if ((args.userId || args.status) && args.type) query = query.filter((q) => q.eq(q.field("type"), args.type));
    
    const requests = await query.order("desc").collect();
    
    // Enrich with user information
    return Promise.all(
      requests.map(async (request) => {
        const user = await ctx.db.get(request.userId);
        const approver = request.approvedBy ? await ctx.db.get(request.approvedBy) : null;
        return {
          ...request,
          userName: user?.name || "Unknown",
          approverName: approver?.name || "Unknown",
        };
      })
    );
  },
});

export const getUpcomingFlights = query({
  args: {
    days: v.optional(v.number()), // Default to 30 days
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const now = Date.now();
    const futureDate = now + (days * 24 * 60 * 60 * 1000);
    
    const flightRequests = await ctx.db
      .query("rnrRequests")
      .withIndex("by_type", (q) => q.eq("type", "flight"))
      .collect();
    
    const upcomingFlights = flightRequests.filter(request => 
      request.status === "approved" && 
      request.startDate >= now && 
      request.startDate <= futureDate
    );
    
    return Promise.all(
      upcomingFlights.map(async (flight) => {
        const user = await ctx.db.get(flight.userId);
        return {
          ...flight,
          userName: user?.name || "Unknown",
          countdownDays: flight.countdownDays || 0,
        };
      })
    );
  },
});

export const getRnRStats = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db.query("rnrRequests").collect();
    const now = Date.now();
    
    const pendingRequests = requests.filter(r => r.status === "pending").length;
    const approvedRequests = requests.filter(r => r.status === "approved").length;
    const rejectedRequests = requests.filter(r => r.status === "rejected").length;
    const completedRequests = requests.filter(r => r.status === "completed").length;
    
    // Flight-specific stats
    const flightRequests = requests.filter(r => r.type === "flight");
    const upcomingFlights = flightRequests.filter(r => 
      r.status === "approved" && r.startDate > now
    ).length;
    
    // Leave-specific stats
    const leaveRequests = requests.filter(r => r.type === "leave");
    const activeLeave = leaveRequests.filter(r => 
      r.status === "approved" && 
      r.startDate <= now && 
      r.endDate >= now
    ).length;
    
    return {
      totalRequests: requests.length,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      completedRequests,
      upcomingFlights,
      activeLeave,
      requestsByType: {
        leave: leaveRequests.length,
        flight: flightRequests.length,
        accommodation: requests.filter(r => r.type === "accommodation").length,
      },
    };
  },
});
