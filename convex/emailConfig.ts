// Shared Resend settings. kizuri-international.com is the domain verified in Resend.
export const EMAIL_FROM = process.env.EMAIL_FROM || "CAMPNAV <notifications@kizuri-international.com>";

// Where email buttons send people: admins to the admin app, staff and residents to the client app
const CLIENT_APP_URL = process.env.CLIENT_APP_URL || "https://campnav.zurimining.com/";
const ADMIN_APP_URL = process.env.ADMIN_APP_URL || "https://campnav-admin.zuridigital.solutions/";
const ADMIN_ROLES = ["camp_manager", "camp_supervisor", "admin"];

export function appUrlForRole(role?: string) {
    return ADMIN_ROLES.includes(role || "") ? ADMIN_APP_URL : CLIENT_APP_URL;
}

// Seed, demo and test addresses that can never receive mail; sending to them
// only produces bounces that hurt the sending domain's reputation
const UNDELIVERABLE_DOMAINS = ["campnav.demo", "test.com", "example.com", "example.org", "localhost"];

export function isDeliverable(email: string) {
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    return !!domain && !UNDELIVERABLE_DOMAINS.includes(domain) && !domain.endsWith(".test") && !domain.endsWith(".invalid");
}

// Alerts older than this are no longer useful as email (e.g. after an outage)
export const EMAIL_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function escapeHtml(text: string) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
