"use client";

import { createAuthClient } from "better-auth/react";

type AuthClient = ReturnType<typeof createAuthClient>;

let authClient: AuthClient | null = null;

function resolveBaseURL(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export function getAuthClient(): AuthClient {
  if (authClient) {
    return authClient;
  }

  authClient = createAuthClient({
    baseURL: resolveBaseURL(),
    basePath: "/api/auth",
  });

  return authClient;
}
