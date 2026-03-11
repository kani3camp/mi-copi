import assert from "node:assert/strict";
import test from "node:test";

const { buildSessionSummaryFromResults } = await import(
  new URL("./summary.ts", import.meta.url).href
);
const {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} = await import(new URL("./format.ts", import.meta.url).href);

test("buildSessionSummaryFromResults aggregates counts and rounds averages to 3 decimals", () => {
  const results = [
    createQuestionResult({
      isCorrect: true,
      errorSemitones: 0,
      responseTimeMs: 1000,
      score: 100,
    }),
    createQuestionResult({
      questionIndex: 1,
      isCorrect: false,
      errorSemitones: -2,
      responseTimeMs: 2101,
      score: 63.3336,
    }),
  ];

  assert.deepEqual(
    buildSessionSummaryFromResults(results, { plannedQuestionCount: 10 }),
    {
      plannedQuestionCount: 10,
      answeredQuestionCount: 2,
      correctQuestionCount: 1,
      sessionScore: 163.334,
      avgScorePerQuestion: 81.667,
      accuracyRate: 0.5,
      avgErrorAbs: 1,
      avgResponseTimeMs: 1550.5,
    },
  );
});

test("buildSessionSummaryFromResults keeps empty-session averages at zero", () => {
  assert.deepEqual(buildSessionSummaryFromResults([]), {
    plannedQuestionCount: undefined,
    answeredQuestionCount: 0,
    correctQuestionCount: 0,
    sessionScore: 0,
    avgScorePerQuestion: 0,
    accuracyRate: 0,
    avgErrorAbs: 0,
    avgResponseTimeMs: 0,
  });
});

test("format helpers round and preserve fallback values for training results", () => {
  assert.equal(formatScoreLabel(83.8), "84");
  assert.equal(formatAccuracyLabel(0.876), "88%");
  assert.equal(formatAvgErrorLabel(1.25), "1.3");
  assert.equal(formatAvgErrorLabel("invalid"), "invalid");
  assert.equal(formatResponseTimeMsLabel(1499.6), "1500 ms");
});

test("formatDateTimeLabel leaves invalid input untouched", () => {
  assert.equal(formatDateTimeLabel("not-a-date"), "not-a-date");
});

function createQuestionResult(overrides: Record<string, unknown>) {
  return {
    questionIndex: 0,
    presentedAt: "2026-03-11T00:00:00.000Z",
    answeredAt: "2026-03-11T00:00:01.000Z",
    mode: "distance",
    baseNoteName: "C",
    baseMidi: 60,
    targetNoteName: "E",
    targetMidi: 64,
    answerNoteName: "E",
    answerMidi: 64,
    targetIntervalSemitones: 4,
    answerIntervalSemitones: 4,
    direction: "up",
    isCorrect: true,
    errorSemitones: 0,
    responseTimeMs: 1000,
    replayBaseCount: 0,
    replayTargetCount: 0,
    score: 100,
    scoreFormulaVersion: "v1",
    ...overrides,
  };
}
