import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createFacilityBooking = mutation({
  args: {
    userId: v.id("users"),
    facility: v.string(), // "gym", "mini_golf", "tennis"
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    numberOfParticipants: v.optional(v.number()),
    specialRequests: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check for conflicting bookings
    const existingBookings = await ctx.db
      .query("facilityBookings")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    
    const hasConflict = existingBookings.some(booking => 
      booking.facility === args.facility &&
      booking.status === "confirmed" &&
      ((args.startTime >= booking.startTime && args.startTime < booking.endTime) ||
       (args.endTime > booking.startTime && args.endTime <= booking.endTime))
    );
    
    if (hasConflict) {
      throw new Error("Time slot conflicts with existing booking");
    }

    return await ctx.db.insert("facilityBookings", {
      userId: args.userId,
      facility: args.facility,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      numberOfParticipants: args.numberOfParticipants,
      specialRequests: args.specialRequests,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateFacilityBookingStatus = mutation({
  args: {
    bookingId: v.id("facilityBookings"),
    status: v.string(), // "pending", "confirmed", "cancelled", "completed"
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Facility booking not found");
    }

    const updateData: any = { status: args.status };

    // Add timestamps for status changes
    const now = Date.now();
    if (args.status === "confirmed") {
      updateData.confirmedAt = now;
    } else if (args.status === "completed") {
      updateData.completedAt = now;
    }

    await ctx.db.patch(args.bookingId, updateData);
    return await ctx.db.get(args.bookingId);
  },
});

export const getFacilityBookings = query({
  args: {
    userId: v.optional(v.id("users")),
    facility: v.optional(v.string()),
    date: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = args.userId
      ? ctx.db.query("facilityBookings").withIndex("by_userId", (q) => q.eq("userId", args.userId!))
      : args.facility
        ? ctx.db.query("facilityBookings").withIndex("by_facility", (q) => q.eq("facility", args.facility!))
        : args.date
          ? ctx.db.query("facilityBookings").withIndex("by_date", (q) => q.eq("date", args.date!))
          : args.status
            ? ctx.db.query("facilityBookings").withIndex("by_status", (q) => q.eq("status", args.status!))
            : ctx.db.query("facilityBookings");

    if (args.userId && args.facility) query = query.filter((q) => q.eq(q.field("facility"), args.facility));
    if ((args.userId || args.facility) && args.date) query = query.filter((q) => q.eq(q.field("date"), args.date));
    if ((args.userId || args.facility || args.date) && args.status) query = query.filter((q) => q.eq(q.field("status"), args.status));
    
    const bookings = await query.order("desc").collect();
    
    // Enrich with user information
    return Promise.all(
      bookings.map(async (booking) => {
        const user = await ctx.db.get(booking.userId);
        return {
          ...booking,
          userName: user?.name || "Unknown",
        };
      })
    );
  },
});

export const getFacilitySchedule = query({
  args: {
    facility: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("facilityBookings")
      .withIndex("by_facility", (q) => q.eq("facility", args.facility))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();
    
    // Group bookings by date and sort by time
    const schedule = bookings.reduce((acc, booking) => {
      const dateStr = new Date(booking.date).toDateString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push({
        ...booking,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    // Sort time slots within each date
    Object.keys(schedule).forEach(date => {
      schedule[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return schedule;
  },
});

export const getFacilityStats = query({
  args: {
    facility: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startDate = args.startDate || Date.now() - (30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || Date.now();
    
    const query = args.facility
      ? ctx.db.query("facilityBookings").withIndex("by_facility", (q) => q.eq("facility", args.facility!))
      : ctx.db.query("facilityBookings");
    
    const bookings = await query
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();
    
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
    const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;
    const completedBookings = bookings.filter(b => b.status === "completed").length;
    
    // Stats by facility
    const facilityStats = bookings.reduce((acc, booking) => {
      if (!acc[booking.facility]) {
        acc[booking.facility] = {
          total: 0,
          confirmed: 0,
          cancelled: 0,
          completed: 0,
          totalParticipants: 0,
        };
      }
      
      acc[booking.facility].total++;
      acc[booking.facility][booking.status]++;
      acc[booking.facility].totalParticipants += booking.numberOfParticipants || 1;
      
      return acc;
    }, {} as Record<string, any>);
    
    return {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      confirmationRate: totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0,
      facilityStats,
    };
  },
});

export const checkFacilityAvailability = query({
  args: {
    facility: v.string(),
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("facilityBookings")
      .withIndex("by_facility", (q) => q.eq("facility", args.facility))
      .filter((q) => q.eq(q.field("date"), args.date))
      .collect();
    
    const confirmedBookings = bookings.filter(booking => 
      booking.status === "confirmed"
    );
    
    const hasConflict = confirmedBookings.some(booking => 
      (args.startTime >= booking.startTime && args.startTime < booking.endTime) ||
      (args.endTime > booking.startTime && args.endTime <= booking.endTime)
    );
    
    // Get available time slots
    const allSlots = generateTimeSlots();
    const bookedSlots = confirmedBookings.map(booking => ({
      start: booking.startTime,
      end: booking.endTime,
    }));
    
    const availableSlots = allSlots.filter(slot => 
      !bookedSlots.some(booked => 
        (slot.start >= booked.start && slot.start < booked.end) ||
        (slot.end > booked.start && slot.end <= booked.end)
      )
    );
    
    return {
      isAvailable: !hasConflict,
      availableSlots,
      bookedSlots,
      conflictingBookings: hasConflict ? confirmedBookings.filter(booking => 
        (args.startTime >= booking.startTime && args.startTime < booking.endTime) ||
        (args.endTime > booking.startTime && args.endTime <= booking.endTime)
      ) : [],
    };
  },
});

// Helper function to generate standard time slots
function generateTimeSlots() {
  const slots = [];
  const startHour = 6; // 6 AM
  const endHour = 22; // 10 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinute = minute + 30;
      const endHour = endMinute >= 60 ? hour + 1 : hour;
      const endMinuteFormatted = endMinute >= 60 ? '00' : endMinute.toString().padStart(2, '0');
      const end = `${endHour.toString().padStart(2, '0')}:${endMinuteFormatted}`;
      
      if (endHour <= endHour) {
        slots.push({ start, end });
      }
    }
  }
  
  return slots;
}
