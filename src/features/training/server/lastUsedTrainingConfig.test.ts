import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultDistanceTrainingConfig,
  createDefaultKeyboardTrainingConfig,
} from "../model/config.ts";
import { createMockDb } from "./test-helpers.ts";

const {
  getLastUsedTrainingConfigsForCurrentUser,
  resetLastUsedTrainingConfigForCurrentUser,
  tryUpdateLastUsedTrainingConfigForCurrentUser,
  updateLastUsedTrainingConfigForCurrentUser,
} = await import(new URL("./lastUsedTrainingConfig.ts", import.meta.url).href);

test("getLastUsedTrainingConfigsForCurrentUser returns the guest-safe empty payload", async () => {
  const result = await getLastUsedTrainingConfigsForCurrentUser({
    getCurrentUser: async () => null,
  });

  assert.deepEqual(result, {
    isAuthenticated: false,
    lastDistanceConfig: null,
    lastKeyboardConfig: null,
    updatedAt: null,
  });
});

test("getLastUsedTrainingConfigsForCurrentUser normalizes malformed saved snapshots", async () => {
  const { db } = createMockDb([
    [
      {
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

  const result = await getLastUsedTrainingConfigsForCurrentUser({
    db: db as never,
    getCurrentUser: async () => ({
      id: "user-1",
      name: null,
      email: null,
      image: null,
    }),
  });

  assert.equal(result.isAuthenticated, true);
  assert.deepEqual(
    result.lastDistanceConfig,
    createDefaultDistanceTrainingConfig(),
  );
  assert.deepEqual(
    result.lastKeyboardConfig,
    createDefaultKeyboardTrainingConfig(),
  );
  assert.equal(result.updatedAt, "2026-03-12T10:00:00.000Z");
});

test("tryUpdateLastUsedTrainingConfigForCurrentUser swallows recoverable storage errors", async () => {
  const { db } = createMockDb([
    new Error('relation "user_settings" does not exist'),
  ]);

  await assert.doesNotReject(async () => {
    await tryUpdateLastUsedTrainingConfigForCurrentUser(
      "distance",
      createDefaultDistanceTrainingConfig(),
      {
        db: db as never,
        getCurrentUser: async () => ({
          id: "user-1",
          name: null,
          email: null,
          image: null,
        }),
      },
    );
  });
});

test("updateLastUsedTrainingConfigForCurrentUser preserves global settings and writes normalized configs", async () => {
  const { db, insertCalls } = createMockDb([
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
      },
    ],
  ]);

  await updateLastUsedTrainingConfigForCurrentUser(
    "distance",
    {
      ...createDefaultDistanceTrainingConfig(),
      intervalRange: {
        minSemitone: 1,
        maxSemitone: 7,
      },
    },
    {
      db: db as never,
      getCurrentUser: async () => ({
        id: "user-1",
        name: null,
        email: null,
        image: null,
      }),
      now: () => new Date("2026-03-12T12:00:00.000Z"),
    },
  );

  assert.equal(insertCalls.length, 1);
  const payload = insertCalls[0]?.values[0] as Record<string, unknown>;
  assert.equal(payload.masterVolume, 64);
  assert.equal(payload.soundEffectsEnabled, false);
  assert.deepEqual(payload.lastDistanceConfig, {
    ...createDefaultDistanceTrainingConfig(),
    intervalRange: {
      minSemitone: 1,
      maxSemitone: 7,
    },
  });
  assert.deepEqual(
    payload.lastKeyboardConfig,
    createDefaultKeyboardTrainingConfig(),
  );
});

test("resetLastUsedTrainingConfigForCurrentUser writes the default config for the requested mode", async () => {
  const { db, insertCalls } = createMockDb([[]]);

  await resetLastUsedTrainingConfigForCurrentUser("keyboard", {
    db: db as never,
    getCurrentUser: async () => ({
      id: "user-1",
      name: null,
      email: null,
      image: null,
    }),
    now: () => new Date("2026-03-12T12:00:00.000Z"),
  });

  const payload = insertCalls[0]?.values[0] as Record<string, unknown>;
  assert.deepEqual(
    payload.lastKeyboardConfig,
    createDefaultKeyboardTrainingConfig(),
  );
});
