import assert from "node:assert/strict";
import test from "node:test";
import { createMockDb } from "../../training/server/test-helpers.ts";
import { createDefaultGlobalUserSettings } from "../model/global-user-settings.ts";

const { getCurrentUserSettingsSnapshot } = await import(
  new URL("./getCurrentUserSettingsSnapshot.ts", import.meta.url).href
);

test("getCurrentUserSettingsSnapshot returns guest-safe defaults", async () => {
  const result = await getCurrentUserSettingsSnapshot({
    currentUser: null,
  });

  assert.deepEqual(result, {
    isAuthenticated: false,
    settings: createDefaultGlobalUserSettings(),
    lastDistanceConfig: null,
    lastKeyboardConfig: null,
    updatedAt: null,
  });
});

test("getCurrentUserSettingsSnapshot normalizes saved settings and configs in one read", async () => {
  const { db } = createMockDb([
    [
      {
        masterVolume: 64,
        soundEffectsEnabled: false,
        intervalNotationStyle: "mixed",
        keyboardNoteLabelsVisible: false,
        lastDistanceConfig: {
          mode: "distance",
          intervalRange: {},
          endCondition: { type: "question_count" },
        },
        lastKeyboardConfig: {
          mode: "keyboard",
          intervalRange: {},
          endCondition: { type: "question_count" },
        },
        updatedAt: new Date("2026-03-12T10:00:00.000Z"),
      },
    ],
  ]);

  const result = await getCurrentUserSettingsSnapshot({
    db: db as never,
    currentUser: {
      id: "user-1",
      name: "Tester",
      email: "tester@example.com",
      image: null,
    },
  });

  assert.equal(result.isAuthenticated, true);
  assert.deepEqual(result.settings, {
    masterVolume: 64,
    soundEffectsEnabled: false,
    intervalNotationStyle: "mixed",
    keyboardNoteLabelsVisible: false,
  });
  assert.equal(result.lastDistanceConfig?.mode, "distance");
  assert.equal(result.lastKeyboardConfig?.mode, "keyboard");
  assert.equal(result.updatedAt, "2026-03-12T10:00:00.000Z");
});
