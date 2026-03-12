import type {
  BaseNoteMode,
  DistanceTrainingConfig,
  IntervalRange,
  KeyboardTrainingConfig,
  NoteClass,
  TrainingConfig,
  TrainingEndCondition,
  TrainingEndConditionByQuestionCount,
  TrainingEndConditionByTimeLimit,
  TrainingMode,
} from "./types";

export const TRAINING_CONFIG_LIMITS = {
  intervalRange: {
    minSemitone: { min: 0, max: 11, default: 0 },
    maxSemitone: { min: 1, max: 12, default: 12 },
  },
  questionCount: {
    min: 5,
    max: 50,
    default: 10,
  },
  timeLimitSeconds: {
    min: 60,
    max: 1800,
    default: 180,
  },
} as const;

const NOTE_CLASSES = new Set<NoteClass>([
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]);

export function createDefaultIntervalRange(): IntervalRange {
  return {
    minSemitone: TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.default,
    maxSemitone: TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.default,
  };
}

export function createDefaultQuestionCountEndCondition(): TrainingEndConditionByQuestionCount {
  return {
    type: "question_count",
    questionCount: TRAINING_CONFIG_LIMITS.questionCount.default,
  };
}

export function createDefaultTimeLimitEndCondition(): TrainingEndConditionByTimeLimit {
  return {
    type: "time_limit",
    timeLimitSeconds: TRAINING_CONFIG_LIMITS.timeLimitSeconds.default,
  };
}

export function createDefaultDistanceTrainingConfig(): DistanceTrainingConfig {
  return {
    mode: "distance",
    intervalRange: createDefaultIntervalRange(),
    directionMode: "mixed",
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: createDefaultQuestionCountEndCondition(),
    intervalGranularity: "simple",
  };
}

export function createDefaultKeyboardTrainingConfig(): KeyboardTrainingConfig {
  return {
    mode: "keyboard",
    intervalRange: createDefaultIntervalRange(),
    directionMode: "mixed",
    includeUnison: false,
    includeOctave: true,
    baseNoteMode: "random",
    fixedBaseNote: null,
    endCondition: createDefaultQuestionCountEndCondition(),
  };
}

export function createDefaultTrainingConfig(
  mode: "distance",
): DistanceTrainingConfig;
export function createDefaultTrainingConfig(
  mode: "keyboard",
): KeyboardTrainingConfig;
export function createDefaultTrainingConfig(mode: TrainingMode): TrainingConfig;
export function createDefaultTrainingConfig(
  mode: TrainingMode,
): TrainingConfig {
  return mode === "distance"
    ? createDefaultDistanceTrainingConfig()
    : createDefaultKeyboardTrainingConfig();
}

export function clampQuestionCount(value: unknown): number {
  return clampInteger(
    value,
    TRAINING_CONFIG_LIMITS.questionCount.min,
    TRAINING_CONFIG_LIMITS.questionCount.max,
    TRAINING_CONFIG_LIMITS.questionCount.default,
  );
}

export function clampTimeLimitSeconds(value: unknown): number {
  return clampInteger(
    value,
    TRAINING_CONFIG_LIMITS.timeLimitSeconds.min,
    TRAINING_CONFIG_LIMITS.timeLimitSeconds.max,
    TRAINING_CONFIG_LIMITS.timeLimitSeconds.default,
  );
}

export function clampIntervalMinSemitone(value: unknown): number {
  return clampInteger(
    value,
    TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.min,
    TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max,
    TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.default,
  );
}

export function clampIntervalMaxSemitone(
  value: unknown,
  minSemitone: number,
): number {
  const clampedValue = clampInteger(
    value,
    TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.min,
    TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.max,
    TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.default,
  );

  return Math.max(clampedValue, minSemitone);
}

export function validateIntervalRange(
  intervalRange: IntervalRange,
): string | null {
  if (
    intervalRange.minSemitone !==
    clampIntervalMinSemitone(intervalRange.minSemitone)
  ) {
    return `minSemitone must be between ${TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.min} and ${TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max}.`;
  }

  if (
    intervalRange.maxSemitone !==
    clampIntervalMaxSemitone(
      intervalRange.maxSemitone,
      intervalRange.minSemitone,
    )
  ) {
    return `maxSemitone must be between ${Math.max(TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.min, intervalRange.minSemitone)} and ${TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.max}.`;
  }

  return null;
}

export function validateQuestionCount(value: number): string | null {
  if (value !== clampQuestionCount(value)) {
    return `questionCount must be between ${TRAINING_CONFIG_LIMITS.questionCount.min} and ${TRAINING_CONFIG_LIMITS.questionCount.max}.`;
  }

  return null;
}

export function validateTimeLimitSeconds(value: number): string | null {
  if (value !== clampTimeLimitSeconds(value)) {
    return `timeLimitSeconds must be between ${TRAINING_CONFIG_LIMITS.timeLimitSeconds.min} and ${TRAINING_CONFIG_LIMITS.timeLimitSeconds.max}.`;
  }

  return null;
}

export function normalizeTrainingEndCondition(
  value: unknown,
): TrainingEndCondition {
  const record = asRecord(value);
  const type = record?.type;

  if (type === "time_limit") {
    return {
      type: "time_limit",
      timeLimitSeconds: clampTimeLimitSeconds(
        getFirstNumber(record, ["timeLimitSeconds"]),
      ),
    };
  }

  return {
    type: "question_count",
    questionCount: clampQuestionCount(
      getFirstNumber(record, ["questionCount"]),
    ),
  };
}

export function normalizeTrainingConfig(
  value: unknown,
  fallbackMode?: TrainingMode,
): TrainingConfig | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const mode = readTrainingMode(record.mode) ?? fallbackMode;

  if (!mode) {
    return null;
  }

  const intervalRangeRecord = asRecord(record.intervalRange);
  const minSemitone = clampIntervalMinSemitone(
    getFirstNumber(intervalRangeRecord, ["minSemitone"]),
  );
  const maxSemitone = clampIntervalMaxSemitone(
    getFirstNumber(intervalRangeRecord, ["maxSemitone"]),
    minSemitone,
  );
  const baseNoteMode = readBaseNoteMode(record.baseNoteMode);
  const fixedBaseNote = readNoteClass(record.fixedBaseNote);
  const baseConfig = {
    mode,
    intervalRange: {
      minSemitone,
      maxSemitone,
    },
    directionMode: record.directionMode === "up_only" ? "up_only" : "mixed",
    includeUnison: readBoolean(record.includeUnison, false),
    includeOctave: readBoolean(record.includeOctave, true),
    baseNoteMode,
    fixedBaseNote: baseNoteMode === "fixed" ? (fixedBaseNote ?? "C") : null,
    endCondition: normalizeTrainingEndCondition(record.endCondition),
  } as const;

  if (mode === "distance") {
    return {
      ...baseConfig,
      mode: "distance",
      intervalGranularity:
        record.intervalGranularity === "aug_dim" ? "aug_dim" : "simple",
    };
  }

  return {
    ...baseConfig,
    mode: "keyboard",
  };
}

export function normalizeTrainingConfigOrDefault(
  value: unknown,
  mode: "distance",
): DistanceTrainingConfig;
export function normalizeTrainingConfigOrDefault(
  value: unknown,
  mode: "keyboard",
): KeyboardTrainingConfig;
export function normalizeTrainingConfigOrDefault(
  value: unknown,
  mode: TrainingMode,
): TrainingConfig;
export function normalizeTrainingConfigOrDefault(
  value: unknown,
  mode: TrainingMode,
): TrainingConfig {
  return (
    normalizeTrainingConfig(value, mode) ?? createDefaultTrainingConfig(mode)
  );
}

function clampInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const rounded = Math.round(numericValue);

  return Math.min(max, Math.max(min, rounded));
}

function getFirstNumber(
  record: Record<string, unknown> | null,
  keys: string[],
): number | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readBaseNoteMode(value: unknown): BaseNoteMode {
  return value === "fixed" ? "fixed" : "random";
}

function readTrainingMode(value: unknown): TrainingMode | null {
  if (value === "distance" || value === "keyboard") {
    return value;
  }

  return null;
}

function readNoteClass(value: unknown): NoteClass | null {
  return typeof value === "string" && NOTE_CLASSES.has(value as NoteClass)
    ? (value as NoteClass)
    : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}
