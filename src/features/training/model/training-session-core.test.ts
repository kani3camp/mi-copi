import assert from "node:assert/strict";
import test from "node:test";

const {
  createActiveQuestion,
  createSummaryAndSaveInput,
  createTrainingSessionState,
  trainingSessionReducer,
} = await import(new URL("./training-session-core.ts", import.meta.url).href);

test("session start enters preparing with the first question and resets prior session data", () => {
  const initial = createTrainingSessionState();
  const activeQuestion = createActiveQuestion({
    playRequestId: 1,
    presentedAt: "2026-03-14T00:00:01.000Z",
    question: createQuestion(0),
  });

  const nextState = trainingSessionReducer(initial, {
    type: "session_started",
    activeQuestion,
    config: createConfig(),
    deadlineAtMs: 1234,
    questionGeneratorState: createGeneratorState(),
    startedAt: "2026-03-14T00:00:00.000Z",
  });

  assert.equal(nextState.phase, "preparing");
  assert.equal(nextState.activeQuestion?.playRequestId, 1);
  assert.equal(nextState.playbackGeneration.nextPlayRequestId, 2);
  assert.equal(nextState.startedAt, "2026-03-14T00:00:00.000Z");
  assert.equal(nextState.deadlineAtMs, 1234);
});

test("stale answering unlock does not move a newer question to answering", () => {
  const started = trainingSessionReducer(createTrainingSessionState(), {
    type: "session_started",
    activeQuestion: createActiveQuestion({
      playRequestId: 1,
      presentedAt: "2026-03-14T00:00:01.000Z",
      question: createQuestion(0),
    }),
    config: createConfig(),
    deadlineAtMs: null,
    questionGeneratorState: createGeneratorState(),
    startedAt: "2026-03-14T00:00:00.000Z",
  });
  const playing = trainingSessionReducer(started, { type: "preparing_ready" });
  const inFlight = trainingSessionReducer(playing, {
    type: "playback_started",
    playRequestId: 1,
  });
  const advanced = trainingSessionReducer(inFlight, {
    type: "advanced_to_next_question",
    activeQuestion: createActiveQuestion({
      playRequestId: 2,
      presentedAt: "2026-03-14T00:00:03.000Z",
      question: createQuestion(1),
    }),
    questionGeneratorState: createGeneratorState(),
  });
  const unlocked = trainingSessionReducer(advanced, {
    type: "answering_unlocked",
    answeringStartedAt: "2026-03-14T00:00:04.000Z",
    playRequestId: 1,
  });

  assert.equal(unlocked.phase, "preparing");
  assert.equal(unlocked.activeQuestion?.question.questionIndex, 1);
  assert.equal(unlocked.activeQuestion?.answeringStartedAt, null);
});

test("answer commit appends results and moves into feedback", () => {
  const state = trainingSessionReducer(
    trainingSessionReducer(
      trainingSessionReducer(createTrainingSessionState(), {
        type: "session_started",
        activeQuestion: createActiveQuestion({
          playRequestId: 1,
          presentedAt: "2026-03-14T00:00:01.000Z",
          question: createQuestion(0),
        }),
        config: createConfig(),
        deadlineAtMs: null,
        questionGeneratorState: createGeneratorState(),
        startedAt: "2026-03-14T00:00:00.000Z",
      }),
      { type: "preparing_ready" },
    ),
    {
      type: "answering_unlocked",
      answeringStartedAt: "2026-03-14T00:00:02.000Z",
      playRequestId: 1,
    },
  );

  const nextState = trainingSessionReducer(state, {
    type: "answer_committed",
    lastAnsweredWasFinal: false,
    result: createResult(0, "2026-03-14T00:00:03.000Z"),
  });

  assert.equal(nextState.phase, "feedback");
  assert.equal(nextState.results.length, 1);
  assert.equal(
    nextState.feedbackResult?.answeredAt,
    "2026-03-14T00:00:03.000Z",
  );
});

test("session finish freezes summary and pending save payload", () => {
  const baseState = trainingSessionReducer(createTrainingSessionState(), {
    type: "session_started",
    activeQuestion: createActiveQuestion({
      playRequestId: 1,
      presentedAt: "2026-03-14T00:00:01.000Z",
      question: createQuestion(0),
    }),
    config: createConfig(),
    deadlineAtMs: null,
    questionGeneratorState: createGeneratorState(),
    startedAt: "2026-03-14T00:00:00.000Z",
  });
  const answeredState = trainingSessionReducer(baseState, {
    type: "answer_committed",
    lastAnsweredWasFinal: true,
    result: createResult(0, "2026-03-14T00:00:03.000Z"),
  });
  const finalized = createSummaryAndSaveInput({
    buildSaveInput: ({
      endedAt,
      finishReason,
      results,
      startedAt,
      summary,
    }: {
      endedAt: string;
      finishReason: "manual_end" | "target_reached" | "time_up";
      results: Array<{ answeredAt: string }>;
      startedAt: string;
      summary: { questionCount: number };
    }) => ({
      endedAt,
      finishReason,
      resultsCount: results.length,
      startedAt,
      summary,
    }),
    buildSummary: (results: Array<{ answeredAt: string }>) => ({
      questionCount: results.length,
    }),
    config: createConfig(),
    endedAt: "2026-03-14T00:00:03.000Z",
    finishReason: "target_reached",
    results: answeredState.results,
    startedAt: "2026-03-14T00:00:00.000Z",
  });

  const resultState = trainingSessionReducer(answeredState, {
    type: "session_finished",
    endedAt: "2026-03-14T00:00:03.000Z",
    finishReason: "target_reached",
    pendingSaveInput: finalized.pendingSaveInput,
    summary: finalized.summary,
  });

  assert.equal(resultState.phase, "result");
  assert.deepEqual(resultState.summary, { questionCount: 1 });
  assert.deepEqual(resultState.pendingSaveInput, {
    endedAt: "2026-03-14T00:00:03.000Z",
    finishReason: "target_reached",
    resultsCount: 1,
    startedAt: "2026-03-14T00:00:00.000Z",
    summary: { questionCount: 1 },
  });
});

test("time-up with no answers keeps summary but omits save payload", () => {
  const summaryAndSaveInput = createSummaryAndSaveInput({
    buildSaveInput: () => ({ shouldNotExist: true }),
    buildSummary: () => ({ questionCount: 0 }),
    config: createConfig(),
    endedAt: "2026-03-14T00:03:00.000Z",
    finishReason: "time_up",
    results: [],
    startedAt: "2026-03-14T00:00:00.000Z",
  });

  assert.deepEqual(summaryAndSaveInput.summary, { questionCount: 0 });
  assert.equal(summaryAndSaveInput.pendingSaveInput, null);
});

function createConfig() {
  return {
    mode: "distance" as const,
    intervalRange: { minSemitone: 0, maxSemitone: 12 },
    directionMode: "mixed" as const,
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random" as const,
    fixedBaseNote: null,
    endCondition: {
      type: "question_count" as const,
      questionCount: 10,
    },
    intervalGranularity: "simple" as const,
  };
}

function createGeneratorState() {
  return {
    candidateDistances: [1],
    distanceCounts: { 1: 0 },
    recentDistances: [],
  };
}

function createQuestion(questionIndex: number) {
  return {
    questionIndex,
    direction: "up" as const,
    baseNote: "C" as const,
    baseMidi: 60,
    targetNote: "D" as const,
    targetMidi: 62,
    distanceSemitones: 2,
    notationStyle: "sharp" as const,
  };
}

function createResult(questionIndex: number, answeredAt: string) {
  return {
    answeredAt,
    answeredDistanceSemitones: 2,
    errorSemitones: 0,
    isCorrect: true,
    presentedAt: "2026-03-14T00:00:01.000Z",
    question: createQuestion(questionIndex),
    replayBaseCount: 0,
    replayTargetCount: 0,
    responseTimeMs: 1000,
    score: 100,
    scoreFormulaVersion: "v1" as const,
  };
}
