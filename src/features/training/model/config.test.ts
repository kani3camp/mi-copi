import assert from "node:assert/strict";
import test from "node:test";

const {
  TRAINING_CONFIG_LIMITS,
  normalizeTrainingConfig,
  normalizeTrainingConfigOrDefault,
  validateIntervalRange,
  validateQuestionCount,
  validateTimeLimitSeconds,
} = await import(new URL("./config.ts", import.meta.url).href);

test("normalizeTrainingConfig ignores legacy-only keys and falls back to canonical defaults", () => {
  const normalized = normalizeTrainingConfig({
    mode: "distance",
    intervalRange: {
      minSemitones: 1,
      maxSemitones: 9,
    },
    directionMode: "mixed",
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "fixed",
    fixedBaseNote: "F#",
    endCondition: {
      type: "time_limit",
      timeLimitMinutes: 4,
    },
    intervalGranularity: "aug_dim",
  });

  assert.deepEqual(normalized, {
    mode: "distance",
    intervalRange: {
      minSemitone: 0,
      maxSemitone: 12,
    },
    directionMode: "mixed",
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "fixed",
    fixedBaseNote: "F#",
    endCondition: {
      type: "time_limit",
      timeLimitSeconds: TRAINING_CONFIG_LIMITS.timeLimitSeconds.default,
    },
    intervalGranularity: "aug_dim",
  });
});

test("normalizeTrainingConfig preserves canonical configs without reshaping values", () => {
  const normalized = normalizeTrainingConfig({
    mode: "keyboard",
    intervalRange: {
      minSemitone: 0,
      maxSemitone: 12,
    },
    directionMode: "up_only",
    includeUnison: true,
    includeOctave: false,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: {
      type: "question_count",
      questionCount: 12,
    },
  });

  assert.deepEqual(normalized, {
    mode: "keyboard",
    intervalRange: {
      minSemitone: 0,
      maxSemitone: 12,
    },
    directionMode: "up_only",
    includeUnison: true,
    includeOctave: false,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: {
      type: "question_count",
      questionCount: 12,
    },
  });
});

test("normalizeTrainingConfigOrDefault falls back to defaults when config is invalid", () => {
  const normalized = normalizeTrainingConfigOrDefault(
    {
      mode: "keyboard",
      intervalRange: "invalid",
      endCondition: null,
    },
    "keyboard",
  );

  assert.deepEqual(normalized, {
    mode: "keyboard",
    intervalRange: {
      minSemitone: TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.default,
      maxSemitone: TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.default,
    },
    directionMode: "mixed",
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: {
      type: "question_count",
      questionCount: TRAINING_CONFIG_LIMITS.questionCount.default,
    },
  });
});

test("normalizeTrainingConfigOrDefault keeps canonical mode defaults when snapshot shape is unreadable", () => {
  const normalized = normalizeTrainingConfigOrDefault(undefined, "distance");

  assert.deepEqual(normalized, {
    mode: "distance",
    intervalRange: {
      minSemitone: TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.default,
      maxSemitone: TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.default,
    },
    directionMode: "mixed",
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: {
      type: "question_count",
      questionCount: TRAINING_CONFIG_LIMITS.questionCount.default,
    },
    intervalGranularity: "simple",
  });
});

test("validateQuestionCount rejects values outside documented bounds", () => {
  assert.equal(
    validateQuestionCount(TRAINING_CONFIG_LIMITS.questionCount.min - 1),
    `questionCount must be between ${TRAINING_CONFIG_LIMITS.questionCount.min} and ${TRAINING_CONFIG_LIMITS.questionCount.max}.`,
  );
});

test("validateIntervalRange rejects minSemitone above the documented max", () => {
  assert.equal(
    validateIntervalRange({
      minSemitone: TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max + 1,
      maxSemitone: TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.max,
    }),
    `minSemitone must be between ${TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.min} and ${TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max}.`,
  );
});

test("validateTimeLimitSeconds rejects values outside documented bounds", () => {
  assert.equal(
    validateTimeLimitSeconds(TRAINING_CONFIG_LIMITS.timeLimitSeconds.min - 1),
    `timeLimitSeconds must be between ${TRAINING_CONFIG_LIMITS.timeLimitSeconds.min} and ${TRAINING_CONFIG_LIMITS.timeLimitSeconds.max}.`,
  );
});
