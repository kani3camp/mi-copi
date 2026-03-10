import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getDb } from "../db/client";

type AppAuth = ReturnType<typeof betterAuth>;

let authInstance: AppAuth | null = null;

export function getAuth(): AppAuth {
  if (authInstance) {
    return authInstance;
  }

  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set.");
  }

  if (!baseURL) {
    throw new Error("BETTER_AUTH_URL is not set.");
  }

  authInstance = betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
    }),
    secret,
    baseURL,
  });

  return authInstance;
}
