import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getDb } from "../db/client";
import { betterAuthSchema } from "../db/schema/auth";

function createAuth() {
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

  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: betterAuthSchema,
    }),
    secret,
    baseURL,
    basePath: "/api/auth",
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
}

type AppAuth = ReturnType<typeof createAuth>;

let authInstance: AppAuth | null = null;

export function getAuth(): AppAuth {
  return (authInstance ??= createAuth());
}
