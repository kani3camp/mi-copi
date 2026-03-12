import {
  clampIntervalMaxSemitone,
  clampIntervalMinSemitone,
  clampQuestionCount,
  clampTimeLimitSeconds,
  createDefaultTrainingConfig,
  normalizeTrainingConfig,
} from "./config.ts";
import type {
  BaseNoteMode,
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
  NoteClass,
  TrainingConfig,
  TrainingEndCondition,
  TrainingMode,
} from "./types";

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

export interface StoredTrainingConfigReadResult<
  TConfig extends TrainingConfig,
> {
  config: TConfig;
  shouldRewrite: boolean;
}

export function readStoredTrainingConfigOrDefault(
  value: unknown,
  mode: "distance",
): StoredTrainingConfigReadResult<DistanceTrainingConfig>;
export function readStoredTrainingConfigOrDefault(
  value: unknown,
  mode: "keyboard",
): StoredTrainingConfigReadResult<KeyboardTrainingConfig>;
export function readStoredTrainingConfigOrDefault(
  value: unknown,
  mode: TrainingMode,
): StoredTrainingConfigReadResult<TrainingConfig>;
export function readStoredTrainingConfigOrDefault(
  value: unknown,
  mode: TrainingMode,
): StoredTrainingConfigReadResult<TrainingConfig> {
  const canonicalConfig = normalizeTrainingConfig(value, mode);
  const migratedConfig = normalizeLegacyCompatibleTrainingConfig(value, mode);

  if (!migratedConfig) {
    return {
      config: createDefaultTrainingConfig(mode),
      shouldRewrite: false,
    };
  }

  return {
    config: migratedConfig,
    shouldRewrite:
      canonicalConfig === null ||
      !trainingConfigsEqual(canonicalConfig, migratedConfig),
  };
}

function normalizeLegacyCompatibleTrainingConfig(
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
    getFirstNumber(intervalRangeRecord, ["minSemitone", "minSemitones"]),
  );
  const maxSemitone = clampIntervalMaxSemitone(
    getFirstNumber(intervalRangeRecord, ["maxSemitone", "maxSemitones"]),
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
    endCondition: normalizeLegacyCompatibleTrainingEndCondition(
      record.endCondition,
    ),
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

function normalizeLegacyCompatibleTrainingEndCondition(
  value: unknown,
): TrainingEndCondition {
  const record = asRecord(value);

  if (record?.type === "time_limit") {
    return {
      type: "time_limit",
      timeLimitSeconds: clampTimeLimitSeconds(
        getFirstNumber(record, ["timeLimitSeconds"]) ??
          toLegacyMinutesSeconds(getFirstNumber(record, ["timeLimitMinutes"])),
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
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toLegacyMinutesSeconds(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value * 60;
}

function trainingConfigsEqual(
  left: TrainingConfig,
  right: TrainingConfig,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
