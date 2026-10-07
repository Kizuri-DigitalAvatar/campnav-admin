// Runs once when the Next.js server starts.
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Node gives each resolved address (IPv6, then IPv4) only 250ms to connect before
        // moving on. On slow or high-latency networks every attempt times out, so server-side
        // calls to Convex (e.g. login) fail with "fetch failed / ETIMEDOUT". Allow 2s per attempt.
        const net = await import("node:net")
        net.setDefaultAutoSelectFamilyAttemptTimeout(2000)
    }
}
