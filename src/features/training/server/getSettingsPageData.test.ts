import assert from "node:assert/strict";
import test from "node:test";

import type { SettingsPageDataDependencies } from "./getSettingsPageData.ts";

const { getSettingsPageDataForCurrentUser } = await import(
  new URL("./getSettingsPageData.ts", import.meta.url).href
);

test("getSettingsPageDataForCurrentUser returns the guest-safe payload", async () => {
  const result = await getSettingsPageDataForCurrentUser({
    currentUser: null,
  });

  assert.deepEqual(result, {
    isAuthenticated: false,
    user: null,
    lastDistanceConfig: null,
    lastKeyboardConfig: null,
    updatedAt: null,
  });
});

test("getSettingsPageDataForCurrentUser prefers the provided current user and reuses it for last-used configs", async () => {
  type LastUsedTrainingConfigsArg = Parameters<
    NonNullable<SettingsPageDataDependencies["getLastUsedTrainingConfigs"]>
  >[0];
  const currentUser = {
    id: "user-1",
    name: "Tester",
    email: "tester@example.com",
    image: null,
  } as const;

  const result = await getSettingsPageDataForCurrentUser({
    currentUser,
    getCurrentUser: async () => {
      throw new Error("getCurrentUser should not be called");
    },
    getLastUsedTrainingConfigs: async (deps: LastUsedTrainingConfigsArg) => {
      assert.ok(deps);
      assert.equal(deps.currentUser, currentUser);

      return {
        isAuthenticated: true,
        lastDistanceConfig: null,
        lastKeyboardConfig: null,
        updatedAt: "2026-03-12T10:00:00.000Z",
      };
    },
  });

  assert.deepEqual(result, {
    isAuthenticated: true,
    user: currentUser,
    lastDistanceConfig: null,
    lastKeyboardConfig: null,
    updatedAt: "2026-03-12T10:00:00.000Z",
  });
});
