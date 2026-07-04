"use client"

import { useQuery } from "convex-helpers/react/cache";
import { api } from "@convex/_generated/api";

function getCurrentWeekStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // back to Sunday
    return d.getTime();
}

/**
 * Warms the query cache with every tab's initial data right after login,
 * so navigating between pages renders instantly instead of showing skeletons.
 * Uses the exact same queries + args as the pages themselves, so the cache
 * keys match. Data stays live (Convex pushes updates over the websocket).
 */
export function DataPrefetcher() {
    // Dashboard overview
    useQuery(api.users.getStats);
    useQuery(api.tasks.list);
    useQuery(api.orders.list, { status: "all" });
    useQuery(api.requests.list, { status: "all" });
    useQuery(api.rooms.getOccupancyStats);
    useQuery(api.rnr.getRnRStats);
    useQuery(api.facilities.getFacilityStats, {});
    useQuery(api.maintenance.getMaintenanceStats);

    // Users tab
    useQuery(api.users.list, { role: "all" });
    useQuery(api.users.listAll);
    useQuery(api.users.listStaff, {});

    // Requests / Tasks tab
    useQuery(api.requests.list, {});

    // Orders + Products + Room Service
    useQuery(api.orders.list, { status: "all", source: "all" });
    useQuery(api.orders.list, { status: "all", source: "room_service" });
    useQuery(api.products.list, { category: "all" });
    useQuery(api.products.list, {});

    // Menus
    useQuery(api.menus.list, {});
    useQuery(api.menus.getWeek, { weekStart: getCurrentWeekStart() });

    // Camp operations
    useQuery(api.rooms.list);
    useQuery(api.rnr.getRnRRequests, {});
    useQuery(api.facilities.getFacilityBookings, {});
    useQuery(api.facilities.listFacilities, { includeInactive: true });
    useQuery(api.preventive.list);

    // Content + reports
    useQuery(api.reports.list, { status: "all" });
    useQuery(api.announcements.list, { priority: "all" });
    useQuery(api.activities.list);

    return null;
}
