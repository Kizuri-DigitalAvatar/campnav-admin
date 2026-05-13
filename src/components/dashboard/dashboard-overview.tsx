"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Users, AlertTriangle, Calendar, BedDouble, Shield } from "lucide-react";

export function DashboardOverview() {
  const [now] = useState(() => Date.now());
  const rooms = useQuery(api.rooms.list);
  const users = useQuery(api.users.listAll);
  const hseIncidents = useQuery(api.safety.getIncidents, {});
  const rnrRequests = useQuery(api.rnr.getRnRRequests, {});
  const emergencyBroadcasts = useQuery(api.safety.getActiveBroadcasts, {});

  // Calculate occupancy
  const totalRooms = rooms?.length || 0;
  const occupiedRooms = rooms?.filter(room => room.status === "occupied").length || 0;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  // Safety KPIs
  const openIncidents = hseIncidents?.filter(incident => 
    incident.status === "open" || incident.status === "in_progress"
  ).length || 0;
  const criticalIncidents = hseIncidents?.filter(incident => 
    incident.severity === "critical" && incident.status !== "resolved"
  ).length || 0;
  // RnR/Leave stats
  const pendingRnR = rnrRequests?.filter(request => 
    request.status === "pending"
  ).length || 0;
  const upcomingRnR = rnrRequests?.filter(request => 
    request.status === "approved" && 
    request.startDate > now && 
    request.startDate <= now + (7 * 24 * 60 * 60 * 1000) // Next 7 days
  ).length || 0;

  const stats = [
    {
      title: "Occupancy Rate",
      value: `${occupancyRate.toFixed(1)}%`,
      description: `${occupiedRooms}/${totalRooms} rooms occupied`,
      icon: BedDouble,
      trend: occupancyRate > 80 ? "up" : occupancyRate > 60 ? "stable" : "down",
    },
    {
      title: "Open Incidents",
      value: openIncidents.toString(),
      description: `${criticalIncidents} critical`,
      icon: AlertTriangle,
      trend: criticalIncidents > 0 ? "up" : "stable",
    },
    {
      title: "Pending RnR",
      value: pendingRnR.toString(),
      description: `${upcomingRnR} upcoming this week`,
      icon: Calendar,
      trend: pendingRnR > 5 ? "up" : "stable",
    },
    {
      title: "Active Users",
      value: users?.filter(user => user.isOnSite).length.toString() || "0",
      description: `On site today`,
      icon: Users,
      trend: "stable",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Critical Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Critical Incidents
            </CardTitle>
            <CardDescription>Requires immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hseIncidents?.filter(incident => incident.severity === "critical" && incident.status !== "resolved")
                .slice(0, 3)
                .map((incident) => (
                  <div key={incident._id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate capitalize">{incident.type.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">{incident.location}</p>
                    </div>
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No critical incidents</p>}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming RnR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming RnR
            </CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rnrRequests?.filter(request => 
                request.status === "approved" && 
                request.startDate > now && 
                request.startDate <= now + (7 * 24 * 60 * 60 * 1000)
              )
                .slice(0, 3)
                .map((request) => {
                  const daysUntil = Math.ceil((request.startDate - now) / (24 * 60 * 60 * 1000));
                  return (
                    <div key={request._id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{request.type}</p>
                        <p className="text-xs text-muted-foreground">{daysUntil} days</p>
                      </div>
                      <Badge variant={daysUntil <= 3 ? "destructive" : "secondary"}>
                        {daysUntil}d
                      </Badge>
                    </div>
                  );
                }) || <p className="text-sm text-muted-foreground">No upcoming RnR</p>}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Broadcasts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
            <CardDescription>Current broadcasts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {emergencyBroadcasts?.filter(broadcast => broadcast.status === "active")
                .slice(0, 3)
                .map((broadcast) => (
                  <div key={broadcast._id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{broadcast.title}</p>
                      <p className="text-xs text-muted-foreground">{broadcast.type}</p>
                    </div>
                    <Badge className={getSeverityColor(broadcast.severity)}>
                      {broadcast.severity}
                    </Badge>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No active alerts</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
