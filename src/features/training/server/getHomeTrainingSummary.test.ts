import assert from "node:assert/strict";
import test from "node:test";

import { createMockDb } from "./test-helpers.ts";

const { getHomeTrainingSummaryForCurrentUser } = await import(
  new URL("./getHomeTrainingSummary.ts", import.meta.url).href
);

test("getHomeTrainingSummaryForCurrentUser returns the guest-safe empty summary", async () => {
  const result = await getHomeTrainingSummaryForCurrentUser({
    getCurrentUser: async () => null,
  });

  assert.deepEqual(result, {
    isAuthenticated: false,
    totalSessions: 0,
    totalSavedQuestionResults: 0,
    lastTrainingTime: null,
    lastUsedMode: null,
    latestSessionScore: null,
    recentAverageError: null,
    recentAverageResponseTimeMs: null,
    recentSessions: [],
  });
});

test("getHomeTrainingSummaryForCurrentUser returns signed-in counts and recent sessions", async () => {
  const { db } = createMockDb([
    [{ count: 2 }],
    [{ count: 14 }],
    [
      {
        id: "session-2",
        mode: "keyboard",
        answeredQuestionCount: 8,
        sessionScore: 321.5,
        accuracyRate: 0.875,
        avgErrorAbs: 0.25,
        avgResponseTimeMs: 980,
        endedAt: new Date("2026-03-12T10:00:00.000Z"),
      },
      {
        id: "session-1",
        mode: "distance",
        answeredQuestionCount: 6,
        sessionScore: 250.125,
        accuracyRate: 0.667,
        avgErrorAbs: 0.5,
        avgResponseTimeMs: 1250,
        endedAt: new Date("2026-03-11T10:00:00.000Z"),
      },
    ],
  ]);

  const result = await getHomeTrainingSummaryForCurrentUser({
    db: db as never,
    getCurrentUser: async () => ({
      id: "user-1",
      name: "Tester",
      email: null,
      image: null,
    }),
  });

  assert.equal(result.isAuthenticated, true);
  assert.equal(result.totalSessions, 2);
  assert.equal(result.totalSavedQuestionResults, 14);
  assert.equal(result.lastUsedMode, "keyboard");
  assert.equal(result.latestSessionScore, 321.5);
  assert.equal(result.recentAverageError, 0.375);
  assert.equal(result.recentAverageResponseTimeMs, 1115);
  assert.deepEqual(result.recentSessions, [
    {
      id: "session-2",
      mode: "keyboard",
      answeredQuestionCount: 8,
      sessionScore: 321.5,
      accuracyRate: 0.875,
      endedAt: "2026-03-12T10:00:00.000Z",
    },
    {
      id: "session-1",
      mode: "distance",
      answeredQuestionCount: 6,
      sessionScore: 250.125,
      accuracyRate: 0.667,
      endedAt: "2026-03-11T10:00:00.000Z",
    },
  ]);
});
