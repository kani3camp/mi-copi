import assert from "node:assert/strict";
import test from "node:test";

import type {
  SaveTrainingSessionInput,
  SessionFinishReason,
} from "../model/types";
import type {
  PersistedQuestionResultInsert,
  PersistedTrainingSessionInsert,
  SaveTrainingSessionDb,
  SaveTrainingSessionTx,
} from "./saveTrainingSession";

const { saveTrainingSession } = await import(
  new URL("./saveTrainingSession.ts", import.meta.url).href
);

test("saveTrainingSession persists recomputed canonical summary and scores", async () => {
  const db = createMockDb();
  const result = await saveTrainingSession(
    "user-1",
    buildCanonicalInput({
      config: {
        intervalGranularity: "aug_dim",
      },
      summary: {
        answeredQuestionCount: 99,
        correctQuestionCount: 99,
        sessionScore: 999,
        avgScorePerQuestion: 999,
        accuracyRate: 1,
        avgErrorAbs: 999,
        avgResponseTimeMs: 999,
        plannedQuestionCount: 99,
      },
      results: [
        {
          score: 1,
          isCorrect: false,
        },
        {
          questionIndex: 1,
          presentedAt: "2026-03-11T00:00:20.000Z",
          answeredAt: "2026-03-11T00:00:25.000Z",
          targetIntervalSemitones: 6,
          answerIntervalSemitones: 5,
          errorSemitones: -1,
          responseTimeMs: 5000,
          targetNoteName: "F#",
          targetMidi: 66,
          answerNoteName: "F",
          answerMidi: 65,
          score: 1,
        },
      ],
    }),
    {
      db,
      generateSessionId: () => "session-1",
      now: () => new Date("2026-03-12T00:00:00.000Z"),
    },
  );

  assert.deepEqual(result, {
    ok: true,
    sessionId: "session-1",
    savedQuestionCount: 2,
  });
  assert.equal(db.trainingSessions.length, 1);
  assert.equal(db.questionResults.length, 2);
  assert.equal(db.trainingSessions[0]?.answeredQuestionCount, 2);
  assert.equal(db.trainingSessions[0]?.correctQuestionCount, 1);
  assert.equal(db.trainingSessions[0]?.plannedQuestionCount, 10);
  assert.equal(db.trainingSessions[0]?.sessionScore, 184.905);
  assert.equal(db.trainingSessions[0]?.avgScorePerQuestion, 92.453);
  assert.equal(db.trainingSessions[0]?.accuracyRate, 0.5);
  assert.equal(db.trainingSessions[0]?.avgErrorAbs, 0.5);
  assert.equal(db.trainingSessions[0]?.avgResponseTimeMs, 3250);
  assert.equal(
    db.trainingSessions[0]?.configSnapshot.intervalRange.minSemitone,
    0,
  );
  assert.equal(db.questionResults[0]?.score, 126);
  assert.equal(db.questionResults[0]?.isCorrect, true);
  assert.equal(db.questionResults[1]?.score, 58.905);
  assert.equal(db.questionResults[1]?.scoreFormulaVersion, "v1");
});

test("saveTrainingSession normalizes legacy config payloads before persisting", async () => {
  const db = createMockDb();
  const legacyInput = buildCanonicalInput() as unknown as {
    config: Record<string, unknown>;
    endCondition: Record<string, unknown>;
  };

  legacyInput.config = {
    ...legacyInput.config,
    intervalRange: {
      minSemitones: 0,
      maxSemitones: 12,
    } as unknown as Record<string, unknown>,
    endCondition: {
      type: "time_limit",
      timeLimitMinutes: 4,
    } as unknown as Record<string, unknown>,
  };
  legacyInput.endCondition = {
    type: "time_limit",
    timeLimitMinutes: 4,
  } as unknown as Record<string, unknown>;

  const result = await saveTrainingSession(
    "user-1",
    legacyInput as unknown as SaveTrainingSessionInput,
    {
      db,
      generateSessionId: () => "session-2",
    },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(db.trainingSessions[0]?.configSnapshot.endCondition, {
    type: "time_limit",
    timeLimitSeconds: 240,
  });
  assert.equal(db.trainingSessions[0]?.plannedTimeLimitSeconds, 240);
});

test("saveTrainingSession rejects invalid config bounds", async () => {
  const result = await saveTrainingSession(
    "user-1",
    buildCanonicalInput({
      config: {
        intervalRange: {
          minSemitone: 12,
        },
      },
    }),
    { db: createMockDb() },
  );

  assert.deepEqual(result, {
    ok: false,
    code: "INVALID_INPUT",
    message: "minSemitone must be between 0 and 11.",
  });
});

test("saveTrainingSession rejects duplicate or non-contiguous question indexes", async () => {
  const result = await saveTrainingSession(
    "user-1",
    buildCanonicalInput({
      results: [
        {
          questionIndex: 0,
        },
        {
          questionIndex: 2,
        },
      ],
    }),
    { db: createMockDb() },
  );

  assert.deepEqual(result, {
    ok: false,
    code: "INVALID_INPUT",
    message: "questionIndex must be zero-based, contiguous, and ordered.",
  });
});

test("saveTrainingSession rejects session and result timestamp ordering violations", async () => {
  const result = await saveTrainingSession(
    "user-1",
    buildCanonicalInput({
      endedAt: "2026-03-10T23:59:59.000Z",
      results: [
        {
          presentedAt: "2026-03-11T00:01:00.000Z",
          answeredAt: "2026-03-11T00:00:30.000Z",
        },
      ],
    }),
    { db: createMockDb() },
  );

  assert.deepEqual(result, {
    ok: false,
    code: "INVALID_INPUT",
    message:
      "startedAt must be earlier than or equal to endedAt. presentedAt must be earlier than or equal to answeredAt at questionIndex 0. answeredAt must be within the session window at questionIndex 0.",
  });
});

test("saveTrainingSession rejects mixed-mode question rows", async () => {
  const result = await saveTrainingSession(
    "user-1",
    buildCanonicalInput({
      results: [
        {
          mode: "keyboard",
        },
      ],
    }),
    { db: createMockDb() },
  );

  assert.deepEqual(result, {
    ok: false,
    code: "INVALID_INPUT",
    message: "result.mode must match config.mode.",
  });
});

interface MockSaveTrainingSessionDb extends SaveTrainingSessionDb {
  trainingSessions: PersistedTrainingSessionInsert[];
  questionResults: PersistedQuestionResultInsert[];
}

function createMockDb(): MockSaveTrainingSessionDb {
  const trainingSessions: PersistedTrainingSessionInsert[] = [];
  const questionResults: PersistedQuestionResultInsert[] = [];

  const db: MockSaveTrainingSessionDb = {
    trainingSessions,
    questionResults,
    async transaction<T>(
      callback: (tx: SaveTrainingSessionTx) => Promise<T>,
    ): Promise<T> {
      return callback({
        async insertTrainingSession(values: PersistedTrainingSessionInsert) {
          trainingSessions.push(values);
        },
        async insertQuestionResults(values: PersistedQuestionResultInsert[]) {
          questionResults.push(...values);
        },
      });
    },
  };

  return db;
}

interface BuildCanonicalInputOverrides {
  config?: {
    mode?: SaveTrainingSessionInput["config"]["mode"];
    intervalRange?: Partial<
      SaveTrainingSessionInput["config"]["intervalRange"]
    > &
      Record<string, unknown>;
    directionMode?: SaveTrainingSessionInput["config"]["directionMode"];
    includeUnison?: boolean;
    includeOctave?: boolean;
    baseNoteMode?: SaveTrainingSessionInput["config"]["baseNoteMode"];
    fixedBaseNote?: SaveTrainingSessionInput["config"]["fixedBaseNote"];
    endCondition?: Record<string, unknown>;
    intervalGranularity?: "simple" | "aug_dim";
  };
  endCondition?: Record<string, unknown>;
  finishReason?: SessionFinishReason;
  startedAt?: string;
  endedAt?: string;
  summary?: Partial<SaveTrainingSessionInput["summary"]>;
  results?: Array<Partial<SaveTrainingSessionInput["results"][number]>>;
}

function buildCanonicalInput(
  overrides?: BuildCanonicalInputOverrides,
): SaveTrainingSessionInput {
  const baseResults = [
    {
      questionIndex: 0,
      presentedAt: "2026-03-11T00:00:10.000Z",
      answeredAt: "2026-03-11T00:00:11.500Z",
      mode: "distance" as const,
      baseNoteName: "C" as const,
      baseMidi: 60,
      targetNoteName: "D" as const,
      targetMidi: 62,
      answerNoteName: "D" as const,
      answerMidi: 62,
      targetIntervalSemitones: 2,
      answerIntervalSemitones: 2,
      direction: "up" as const,
      isCorrect: true,
      errorSemitones: 0,
      responseTimeMs: 1500,
      replayBaseCount: 0,
      replayTargetCount: 1,
      score: 0,
      scoreFormulaVersion: "v1" as const,
    },
  ];

  return {
    config: {
      mode: "distance",
      intervalRange: {
        minSemitone: overrides?.config?.intervalRange?.minSemitone ?? 0,
        maxSemitone: overrides?.config?.intervalRange?.maxSemitone ?? 12,
      },
      directionMode: overrides?.config?.directionMode ?? "mixed",
      includeUnison: overrides?.config?.includeUnison ?? false,
      includeOctave: overrides?.config?.includeOctave ?? true,
      baseNoteMode: overrides?.config?.baseNoteMode ?? "random",
      fixedBaseNote: overrides?.config?.fixedBaseNote ?? null,
      endCondition: (overrides?.config
        ?.endCondition as unknown as SaveTrainingSessionInput["endCondition"]) ?? {
        type: "question_count",
        questionCount: 10,
      },
      intervalGranularity:
        overrides?.config?.mode === "keyboard"
          ? undefined
          : (overrides?.config?.intervalGranularity ?? "simple"),
    } as SaveTrainingSessionInput["config"],
    finishReason: overrides?.finishReason ?? "target_reached",
    endCondition:
      (overrides?.endCondition as unknown as SaveTrainingSessionInput["endCondition"]) ??
        (overrides?.config
          ?.endCondition as unknown as SaveTrainingSessionInput["endCondition"]) ?? {
          type: "question_count",
          questionCount: 10,
        },
    startedAt: overrides?.startedAt ?? "2026-03-11T00:00:00.000Z",
    endedAt: overrides?.endedAt ?? "2026-03-11T00:02:00.000Z",
    summary: {
      plannedQuestionCount: overrides?.summary?.plannedQuestionCount ?? 10,
      answeredQuestionCount:
        overrides?.summary?.answeredQuestionCount ?? baseResults.length,
      correctQuestionCount: overrides?.summary?.correctQuestionCount ?? 1,
      sessionScore: overrides?.summary?.sessionScore ?? 126,
      avgScorePerQuestion: overrides?.summary?.avgScorePerQuestion ?? 126,
      accuracyRate: overrides?.summary?.accuracyRate ?? 1,
      avgErrorAbs: overrides?.summary?.avgErrorAbs ?? 0,
      avgResponseTimeMs: overrides?.summary?.avgResponseTimeMs ?? 1500,
    },
    results: (overrides?.results ?? baseResults).map((result, index) => ({
      ...baseResults[Math.min(index, baseResults.length - 1)],
      ...result,
    })),
  };
}
