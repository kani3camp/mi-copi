import assert from "node:assert/strict";
import test from "node:test";

const { reduceDistanceTrainingConfig, reduceKeyboardTrainingConfig } =
  await import(
    new URL("./training-config-form-state.ts", import.meta.url).href
  );

test("question-count and time-limit actions replace the end condition with canonical defaults", () => {
  const baseConfig = createDistanceConfig();

  const timeLimitConfig = reduceDistanceTrainingConfig(baseConfig, {
    type: "set_end_condition_type",
    value: "time_limit",
  });
  const questionCountConfig = reduceDistanceTrainingConfig(timeLimitConfig, {
    type: "set_end_condition_type",
    value: "question_count",
  });

  assert.deepEqual(timeLimitConfig.endCondition, {
    type: "time_limit",
    timeLimitSeconds: 180,
  });
  assert.deepEqual(questionCountConfig.endCondition, {
    type: "question_count",
    questionCount: 10,
  });
});

test("min semitone updates clamp the max semitone to stay within range", () => {
  const nextConfig = reduceKeyboardTrainingConfig(createKeyboardConfig(), {
    type: "set_min_semitone",
    value: 11,
  });

  assert.deepEqual(nextConfig.intervalRange, {
    minSemitone: 11,
    maxSemitone: 12,
  });
});

test("fixed base-note mode keeps a fallback note and random mode clears it", () => {
  const fixedConfig = reduceKeyboardTrainingConfig(createKeyboardConfig(), {
    type: "set_base_note_mode",
    value: "fixed",
  });
  const randomConfig = reduceKeyboardTrainingConfig(fixedConfig, {
    type: "set_base_note_mode",
    value: "random",
  });

  assert.equal(fixedConfig.fixedBaseNote, "C");
  assert.equal(randomConfig.fixedBaseNote, null);
});

test("distance reducer keeps interval granularity as a mode-specific action", () => {
  const nextConfig = reduceDistanceTrainingConfig(createDistanceConfig(), {
    type: "set_interval_granularity",
    value: "aug_dim",
  });

  assert.equal(nextConfig.intervalGranularity, "aug_dim");
});

function createDistanceConfig() {
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

function createKeyboardConfig() {
  return {
    mode: "keyboard" as const,
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
  };
}
