import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for pending email notifications every minute
crons.interval(
    "process email notifications",
    { minutes: 1 },
    internal.email.processEmailNotifications
);

export default crons;
