import assert from "node:assert/strict";
import test from "node:test";

import { createMockDb } from "./test-helpers.ts";

const { getTrainingSessionDetailForCurrentUser } = await import(
  new URL("./getTrainingSessionDetail.ts", import.meta.url).href
);

test("getTrainingSessionDetailForCurrentUser returns null for invalid UUID without touching the db", async () => {
  const result = await getTrainingSessionDetailForCurrentUser("not-a-uuid", {
    db: {
      select() {
        throw new Error("db should not be called");
      },
    } as never,
    getCurrentUser: async () => ({
      id: "user-1",
      name: null,
      email: null,
      image: null,
    }),
  });

  assert.equal(result, null);
});

test("getTrainingSessionDetailForCurrentUser returns null when the session is missing or belongs to another user", async () => {
  const { db } = createMockDb([[]]);

  const result = await getTrainingSessionDetailForCurrentUser(
    "11111111-1111-4111-8111-111111111111",
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

  assert.equal(result, null);
});

test("getTrainingSessionDetailForCurrentUser normalizes the stored config snapshot and returns ordered results", async () => {
  const { db } = createMockDb([
    [
      {
        id: "session-1",
        mode: "distance",
        configSnapshot: {
          mode: "distance",
          intervalRange: {},
          endCondition: {
            type: "question_count",
          },
        },
        createdAt: new Date("2026-03-11T09:59:00.000Z"),
        endedAt: new Date("2026-03-11T10:00:00.000Z"),
        answeredQuestionCount: 1,
        correctQuestionCount: 1,
        accuracyRate: 1,
        avgErrorAbs: 0,
        avgResponseTimeMs: 900,
        sessionScore: 120,
      },
    ],
    [
      {
        id: "result-1",
        questionIndex: 0,
        baseNoteName: "C",
        targetNoteName: "G",
        answerNoteName: "G",
        targetIntervalSemitones: 7,
        answerIntervalSemitones: 7,
        direction: "up",
        isCorrect: true,
        errorSemitones: 0,
        responseTimeMs: 900,
      },
    ],
  ]);

  const result = await getTrainingSessionDetailForCurrentUser(
    "11111111-1111-4111-8111-111111111111",
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

  assert.ok(result);
  assert.equal(result.mode, "distance");
  assert.deepEqual(result.configSnapshot.intervalRange, {
    minSemitone: 0,
    maxSemitone: 12,
  });
  assert.equal(result.results[0]?.questionIndex, 0);
  assert.equal(result.results[0]?.responseTimeMs, 900);
});
