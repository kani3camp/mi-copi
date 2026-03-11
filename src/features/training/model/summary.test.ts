import assert from "node:assert/strict";
import test from "node:test";

const { buildSessionSummaryFromResults } = await import(
  new URL("./summary.ts", import.meta.url).href
);
const {
  buildDailyTrendSummaries,
  buildModeTrainingStats,
  buildRecentQuestionSummary,
  buildTrainingOverview,
  summarizeHomeHeadline,
} = await import(new URL("./stats-aggregation.ts", import.meta.url).href);
const {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatDateLabel,
  formatDateTimeLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
  formatTrainingModeLabel,
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
  assert.equal(formatTrainingModeLabel("distance"), "Distance");
  assert.equal(formatTrainingModeLabel("keyboard"), "Keyboard");
});

test("formatDateTimeLabel leaves invalid input untouched", () => {
  assert.equal(formatDateTimeLabel("not-a-date"), "not-a-date");
});

test("formatDateLabel leaves invalid input untouched", () => {
  assert.equal(formatDateLabel("not-a-date"), "not-a-date");
});

test("stats aggregation derives overview, recent windows, and mode breakdowns", () => {
  const sessions = [
    createAggregatableSession({
      mode: "distance",
      sessionScore: 150,
      avgErrorAbs: 1.2,
      avgResponseTimeMs: 1200,
      endedAt: "2026-03-11T03:00:00.000Z",
    }),
    createAggregatableSession({
      mode: "keyboard",
      sessionScore: 75,
      avgErrorAbs: 0.5,
      avgResponseTimeMs: 900,
      endedAt: "2026-03-10T03:00:00.000Z",
    }),
  ];
  const questionResults = [
    createAggregatableQuestion({
      mode: "distance",
      isCorrect: true,
      errorSemitones: 0,
      responseTimeMs: 1000,
      score: 100,
    }),
    createAggregatableQuestion({
      mode: "distance",
      isCorrect: false,
      errorSemitones: -2,
      responseTimeMs: 1400,
      score: 50,
      answeredAt: "2026-03-11T02:00:00.000Z",
    }),
    createAggregatableQuestion({
      mode: "keyboard",
      isCorrect: true,
      errorSemitones: 1,
      responseTimeMs: 800,
      score: 75,
      answeredAt: "2026-03-10T02:00:00.000Z",
    }),
  ];

  assert.deepEqual(buildTrainingOverview(sessions, questionResults), {
    questionCount: 3,
    correctRate: 0.667,
    averageError: 1,
    medianError: 1,
    averageResponseTimeMs: 1066.667,
    cumulativeScore: 225,
  });

  assert.deepEqual(buildModeTrainingStats(sessions, questionResults), {
    distance: {
      sessionCount: 1,
      questionCount: 2,
      correctRate: 0.5,
      averageError: 1,
      medianError: 1,
      averageResponseTimeMs: 1200,
      cumulativeScore: 150,
    },
    keyboard: {
      sessionCount: 1,
      questionCount: 1,
      correctRate: 1,
      averageError: 1,
      medianError: 1,
      averageResponseTimeMs: 800,
      cumulativeScore: 75,
    },
  });

  assert.deepEqual(buildRecentQuestionSummary(questionResults, 2), {
    questionCount: 2,
    correctRate: 0.5,
    averageScore: 75,
    averageError: 1,
    averageResponseTimeMs: 1200,
  });
});

test("home headline aggregation uses latest session and recent session averages", () => {
  assert.deepEqual(
    summarizeHomeHeadline([
      createAggregatableSession({
        mode: "keyboard",
        sessionScore: 88.4,
        avgErrorAbs: 1.2,
        avgResponseTimeMs: 1100,
        endedAt: "2026-03-11T12:00:00.000Z",
      }),
      createAggregatableSession({
        mode: "distance",
        sessionScore: 120,
        avgErrorAbs: 0.8,
        avgResponseTimeMs: 900,
        endedAt: "2026-03-10T12:00:00.000Z",
      }),
    ]),
    {
      lastTrainingTime: "2026-03-11T12:00:00.000Z",
      lastUsedMode: "keyboard",
      latestSessionScore: 88.4,
      recentAverageError: 1,
      recentAverageResponseTimeMs: 1000,
    },
  );

  assert.deepEqual(summarizeHomeHeadline([]), {
    lastTrainingTime: null,
    lastUsedMode: null,
    latestSessionScore: null,
    recentAverageError: null,
    recentAverageResponseTimeMs: null,
  });
});

test("daily trend aggregation groups question results by answered date", () => {
  const results = [
    createAggregatableQuestion({
      score: 90,
      isCorrect: true,
      errorSemitones: 0,
      responseTimeMs: 900,
      answeredAt: "2026-03-11T11:00:00.000Z",
    }),
    createAggregatableQuestion({
      score: 60,
      isCorrect: false,
      errorSemitones: -2,
      responseTimeMs: 1500,
      answeredAt: "2026-03-11T02:00:00.000Z",
    }),
    createAggregatableQuestion({
      score: 75,
      isCorrect: true,
      errorSemitones: 1,
      responseTimeMs: 800,
      answeredAt: "2026-03-10T22:00:00.000Z",
    }),
  ];

  assert.deepEqual(buildDailyTrendSummaries(results), [
    {
      date: "2026-03-11",
      questionCount: 2,
      correctRate: 0.5,
      averageScore: 75,
      averageError: 1,
      averageResponseTimeMs: 1200,
    },
    {
      date: "2026-03-10",
      questionCount: 1,
      correctRate: 1,
      averageScore: 75,
      averageError: 1,
      averageResponseTimeMs: 800,
    },
  ]);
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

function createAggregatableSession(overrides: Record<string, unknown>) {
  return {
    mode: "distance",
    answeredQuestionCount: 10,
    sessionScore: 100,
    avgErrorAbs: 1,
    avgResponseTimeMs: 1000,
    endedAt: "2026-03-11T00:00:00.000Z",
    ...overrides,
  };
}

function createAggregatableQuestion(overrides: Record<string, unknown>) {
  return {
    mode: "distance",
    isCorrect: true,
    errorSemitones: 0,
    responseTimeMs: 1000,
    score: 100,
    answeredAt: "2026-03-11T03:00:00.000Z",
    ...overrides,
  };
}
