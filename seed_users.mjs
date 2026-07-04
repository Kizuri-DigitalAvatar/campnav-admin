import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function seed() {
  const users = [
    {
      name: "Super Admin",
      email: "admin@campnav.com",
      password: "admin123",
      role: "camp_manager",
    },
    {
      name: "Camp Manager",
      email: "manager@campnav.com",
      password: "manager123",
      role: "camp_supervisor",
    },
  ];

  console.log("Seeding test users...");
  for (const user of users) {
    try {
      await client.mutation(api.users.upsert, user);
      console.log(`Created/Updated user: ${user.name} (${user.role})`);
    } catch (e) {
      console.error(`Failed to create user ${user.name}:`, e);
    }
  }
  console.log("Done!");
}

seed();