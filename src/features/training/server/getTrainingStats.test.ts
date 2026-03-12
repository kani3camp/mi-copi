import assert from "node:assert/strict";
import test from "node:test";

import { createMockDb } from "./test-helpers.ts";

const { getTrainingStatsForCurrentUser } = await import(
  new URL("./getTrainingStats.ts", import.meta.url).href
);

test("getTrainingStatsForCurrentUser returns the guest-safe empty stats payload", async () => {
  const result = await getTrainingStatsForCurrentUser({
    getCurrentUser: async () => null,
  });

  assert.equal(result.isAuthenticated, false);
  assert.equal(result.totalSessions, 0);
  assert.equal(result.totalSavedQuestionResults, 0);
  assert.deepEqual(result.recentSessions, []);
  assert.deepEqual(result.scoreTrends, {
    overall: [],
    distance: [],
    keyboard: [],
  });
});

test("getTrainingStatsForCurrentUser builds signed-in stats from saved sessions and question results", async () => {
  const { db } = createMockDb([
    [
      {
        id: "session-2",
        mode: "keyboard",
        answeredQuestionCount: 2,
        sessionScore: 210.5,
        accuracyRate: 1,
        avgErrorAbs: 0,
        avgResponseTimeMs: 900,
        endedAt: new Date("2026-03-12T10:00:00.000Z"),
      },
      {
        id: "session-1",
        mode: "distance",
        answeredQuestionCount: 2,
        sessionScore: 140.25,
        accuracyRate: 0.5,
        avgErrorAbs: 0.5,
        avgResponseTimeMs: 1100,
        endedAt: new Date("2026-03-11T10:00:00.000Z"),
      },
    ],
    [
      {
        mode: "keyboard",
        isCorrect: true,
        targetIntervalSemitones: 7,
        direction: "up",
        errorSemitones: 0,
        responseTimeMs: 800,
        score: 120,
        answeredAt: new Date("2026-03-12T10:00:00.000Z"),
      },
      {
        mode: "keyboard",
        isCorrect: true,
        targetIntervalSemitones: 4,
        direction: "down",
        errorSemitones: 0,
        responseTimeMs: 1000,
        score: 90.5,
        answeredAt: new Date("2026-03-12T10:01:00.000Z"),
      },
      {
        mode: "distance",
        isCorrect: false,
        targetIntervalSemitones: 3,
        direction: "up",
        errorSemitones: 1,
        responseTimeMs: 1200,
        score: 70.25,
        answeredAt: new Date("2026-03-11T10:00:00.000Z"),
      },
      {
        mode: "distance",
        isCorrect: true,
        targetIntervalSemitones: 5,
        direction: "down",
        errorSemitones: 0,
        responseTimeMs: 1000,
        score: 70,
        answeredAt: new Date("2026-03-11T10:01:00.000Z"),
      },
    ],
  ]);

  const result = await getTrainingStatsForCurrentUser({
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
  assert.equal(result.totalSavedQuestionResults, 4);
  assert.equal(result.overview.questionCount, 4);
  assert.equal(result.overview.correctRate, 0.75);
  assert.equal(result.recentQuestionSummaries.recent10.questionCount, 4);
  assert.equal(result.byMode.distance.sessionCount, 1);
  assert.equal(result.byMode.keyboard.sessionCount, 1);
  assert.equal(result.recentSessions.length, 2);
  assert.deepEqual(result.recentSessions[0], {
    id: "session-2",
    mode: "keyboard",
    answeredQuestionCount: 2,
    sessionScore: 210.5,
    accuracyRate: 1,
    endedAt: "2026-03-12T10:00:00.000Z",
  });
  assert.equal(result.scoreTrends.overall.length, 2);
  assert.equal(result.dailyTrends.length, 2);
});
