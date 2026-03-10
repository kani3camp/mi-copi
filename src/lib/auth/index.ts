import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getDb } from "../db/client";
import { betterAuthSchema } from "../db/schema/auth";

type AppAuth = ReturnType<typeof betterAuth>;

let authInstance: AppAuth | null = null;

export function getAuth(): AppAuth {
  if (authInstance) {
    return authInstance;
  }

  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set.");
  }

  if (!baseURL) {
    throw new Error("BETTER_AUTH_URL is not set.");
  }

  authInstance = betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: betterAuthSchema,
    }),
    secret,
    baseURL,
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : undefined,
  });

  return authInstance;
}
