// Single Drizzle schema entrypoint for migration generation and other tooling.
// Auth and app tables stay split by responsibility in their own modules.

export * from "./app";
export * from "./auth";
