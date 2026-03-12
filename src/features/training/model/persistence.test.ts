import assert from "node:assert/strict";
import test from "node:test";

const { toQuestionResultInsert, toTrainingSessionInsert } = await import(
  new URL("./persistence.ts", import.meta.url).href
);

test("toTrainingSessionInsert preserves canonical time-limit seconds", () => {
  const insert = toTrainingSessionInsert(
    {
      config: {
        mode: "distance",
        intervalRange: {
          minSemitone: 0,
          maxSemitone: 12,
        },
        directionMode: "mixed",
        includeUnison: false,
        includeOctave: true,
        baseNoteMode: "random",
        fixedBaseNote: null,
        endCondition: {
          type: "time_limit",
          timeLimitSeconds: 180,
        },
        intervalGranularity: "simple",
      },
      finishReason: "time_up",
      endCondition: {
        type: "time_limit",
        timeLimitSeconds: 180,
      },
      startedAt: "2026-03-11T00:00:00.000Z",
      endedAt: "2026-03-11T00:03:00.000Z",
      summary: {
        answeredQuestionCount: 2,
        correctQuestionCount: 1,
        sessionScore: 144.5,
        avgScorePerQuestion: 72.25,
        accuracyRate: 0.5,
        avgErrorAbs: 1,
        avgResponseTimeMs: 1200,
      },
      results: [
        {
          questionIndex: 0,
          presentedAt: "2026-03-11T00:00:05.000Z",
          answeredAt: "2026-03-11T00:00:06.000Z",
          mode: "distance",
          baseNoteName: "C",
          baseMidi: 60,
          targetNoteName: "D",
          targetMidi: 62,
          answerNoteName: "D",
          answerMidi: 62,
          targetIntervalSemitones: 2,
          answerIntervalSemitones: 2,
          direction: "up",
          isCorrect: true,
          errorSemitones: 0,
          responseTimeMs: 1000,
          replayBaseCount: 0,
          replayTargetCount: 0,
          score: 100,
          scoreFormulaVersion: "v1",
        },
      ],
    },
    "user-1",
  );

  assert.equal(insert.endConditionType, "time_limit");
  assert.equal(insert.plannedQuestionCount, null);
  assert.equal(insert.plannedTimeLimitSeconds, 180);
});

test("toQuestionResultInsert preserves distance-mode replay counters", () => {
  const insert = toQuestionResultInsert(
    {
      questionIndex: 0,
      presentedAt: "2026-03-11T00:00:05.000Z",
      answeredAt: "2026-03-11T00:00:06.400Z",
      mode: "distance",
      baseNoteName: "C",
      baseMidi: 60,
      targetNoteName: "E",
      targetMidi: 64,
      answerNoteName: "D#",
      answerMidi: 63,
      targetIntervalSemitones: 4,
      answerIntervalSemitones: 3,
      direction: "up",
      isCorrect: false,
      errorSemitones: -1,
      responseTimeMs: 1400,
      replayBaseCount: 2,
      replayTargetCount: 5,
      score: 82.5,
      scoreFormulaVersion: "v1",
    },
    "session-1",
    "user-1",
  );

  assert.equal(insert.replayBaseCount, 2);
  assert.equal(insert.replayTargetCount, 5);
  assert.equal(insert.trainingSessionId, "session-1");
});

test("toQuestionResultInsert preserves keyboard-mode replay counters", () => {
  const insert = toQuestionResultInsert(
    {
      questionIndex: 0,
      presentedAt: "2026-03-11T00:00:05.000Z",
      answeredAt: "2026-03-11T00:00:05.900Z",
      mode: "keyboard",
      baseNoteName: "G",
      baseMidi: 67,
      targetNoteName: "E",
      targetMidi: 64,
      answerNoteName: "F",
      answerMidi: 65,
      targetIntervalSemitones: 3,
      answerIntervalSemitones: 2,
      direction: "down",
      isCorrect: false,
      errorSemitones: -1,
      responseTimeMs: 900,
      replayBaseCount: 1,
      replayTargetCount: 4,
      score: 88.5,
      scoreFormulaVersion: "v1",
    },
    "session-2",
    "user-1",
  );

  assert.equal(insert.replayBaseCount, 1);
  assert.equal(insert.replayTargetCount, 4);
  assert.equal(insert.trainingSessionId, "session-2");
});
