import {
  normalizeTrainingConfig,
  normalizeTrainingEndCondition,
} from "../model/config.ts";
import { validateDistanceTrainingConfig } from "../model/distance-guest.ts";
import { validateKeyboardTrainingConfig } from "../model/keyboard-guest.ts";
import {
  calculateQuestionScoreV1,
  isCorrectByErrorSemitones,
  SCORE_FORMULA_VERSION_V1,
} from "../model/scoring.ts";
import { buildSessionSummaryFromResults } from "../model/summary.ts";
import type {
  NoteClass,
  QuestionDirection,
  SaveQuestionResultInput,
  SaveTrainingSessionInput,
  TrainingConfig,
  TrainingEndCondition,
  TrainingMode,
} from "../model/types";

const NOTE_CLASSES: NoteClass[] = [
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
];

interface NormalizedResult {
  input: SaveTrainingSessionInput;
  issues: string[];
}

export function normalizeSaveTrainingSessionInput(
  input: SaveTrainingSessionInput,
): NormalizedResult {
  const issues: string[] = [];
  const rawConfigIssues = validateProvidedTrainingConfig(input.config);
  const rawEndConditionIssues = validateProvidedTrainingEndCondition(
    input.endCondition,
  );
  const normalizedConfig = normalizeTrainingConfig(input.config);

  if (!normalizedConfig) {
    return {
      input,
      issues: ["config is invalid."],
    };
  }

  issues.push(...rawConfigIssues);
  issues.push(...rawEndConditionIssues);

  const configIssue = validateTrainingConfigByMode(normalizedConfig);

  if (configIssue) {
    issues.push(configIssue);
  }

  const normalizedEndCondition = normalizeTrainingEndCondition(
    input.endCondition,
  );

  if (
    !trainingEndConditionsEqual(
      normalizedConfig.endCondition,
      normalizedEndCondition,
    )
  ) {
    issues.push("endCondition must match config.endCondition.");
  }

  const startedAt = normalizeIsoTimestamp(input.startedAt);
  const endedAt = normalizeIsoTimestamp(input.endedAt);

  if (!startedAt) {
    issues.push("startedAt is invalid.");
  }

  if (!endedAt) {
    issues.push("endedAt is invalid.");
  }

  if (startedAt && endedAt && startedAt > endedAt) {
    issues.push("startedAt must be earlier than or equal to endedAt.");
  }

  if (input.results.length === 0) {
    issues.push("At least one answered question result is required.");
  }

  const normalizedResults = input.results.map((result, index) =>
    normalizeQuestionResult({
      result,
      index,
      mode: normalizedConfig.mode,
      config: normalizedConfig,
      sessionStartedAt: startedAt,
      sessionEndedAt: endedAt,
      skipConfigDependentChecks:
        rawConfigIssues.length > 0 || rawEndConditionIssues.length > 0,
      issues,
    }),
  );

  const plannedQuestionCount =
    normalizedEndCondition.type === "question_count"
      ? normalizedEndCondition.questionCount
      : undefined;

  return {
    input: {
      config: normalizedConfig,
      finishReason: input.finishReason,
      endCondition: normalizedEndCondition,
      startedAt: startedAt ?? input.startedAt,
      endedAt: endedAt ?? input.endedAt,
      summary: buildSessionSummaryFromResults(normalizedResults, {
        plannedQuestionCount,
      }),
      results: normalizedResults,
    },
    issues,
  };
}

function normalizeQuestionResult(params: {
  result: SaveQuestionResultInput;
  index: number;
  mode: TrainingMode;
  config: TrainingConfig;
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
  skipConfigDependentChecks: boolean;
  issues: string[];
}): SaveQuestionResultInput {
  const {
    result,
    index,
    mode,
    config,
    sessionStartedAt,
    sessionEndedAt,
    skipConfigDependentChecks,
    issues,
  } = params;

  if (result.questionIndex !== index) {
    issues.push("questionIndex must be zero-based, contiguous, and ordered.");
  }

  if (result.mode !== mode) {
    issues.push("result.mode must match config.mode.");
  }

  const direction = normalizeDirection(result.direction);

  if (!direction) {
    issues.push(
      `result.direction is invalid at questionIndex ${result.questionIndex}.`,
    );
  }

  const baseNoteName = normalizeNoteClass(result.baseNoteName);
  const targetNoteName = normalizeNoteClass(result.targetNoteName);
  const answerNoteName = normalizeNoteClass(result.answerNoteName);

  if (!baseNoteName || !targetNoteName || !answerNoteName) {
    issues.push(
      `result note names are invalid at questionIndex ${result.questionIndex}.`,
    );
  }

  const presentedAt = normalizeIsoTimestamp(result.presentedAt);
  const answeredAt = normalizeIsoTimestamp(result.answeredAt);

  if (!presentedAt || !answeredAt) {
    issues.push(
      `result timestamps are invalid at questionIndex ${result.questionIndex}.`,
    );
  }

  if (presentedAt && answeredAt && presentedAt > answeredAt) {
    issues.push(
      `presentedAt must be earlier than or equal to answeredAt at questionIndex ${result.questionIndex}.`,
    );
  }

  if (presentedAt && sessionStartedAt && presentedAt < sessionStartedAt) {
    issues.push(
      `presentedAt must be within the session window at questionIndex ${result.questionIndex}.`,
    );
  }

  if (answeredAt && sessionEndedAt && answeredAt > sessionEndedAt) {
    issues.push(
      `answeredAt must be within the session window at questionIndex ${result.questionIndex}.`,
    );
  }

  const baseMidi = normalizeInteger(result.baseMidi);
  const targetMidi = normalizeInteger(result.targetMidi);
  const answerMidi = normalizeInteger(result.answerMidi);
  const responseTimeMs = normalizeInteger(result.responseTimeMs);
  const replayBaseCount = normalizeInteger(result.replayBaseCount);
  const replayTargetCount = normalizeInteger(result.replayTargetCount);
  const targetIntervalSemitones = normalizeInteger(
    result.targetIntervalSemitones,
  );
  const answerIntervalSemitones = normalizeInteger(
    result.answerIntervalSemitones,
  );
  const errorSemitones = normalizeInteger(result.errorSemitones);

  if (
    baseMidi === null ||
    targetMidi === null ||
    answerMidi === null ||
    responseTimeMs === null ||
    replayBaseCount === null ||
    replayTargetCount === null ||
    targetIntervalSemitones === null ||
    answerIntervalSemitones === null ||
    errorSemitones === null
  ) {
    issues.push(
      `numeric fields are invalid at questionIndex ${result.questionIndex}.`,
    );
  }

  if (responseTimeMs !== null && responseTimeMs < 0) {
    issues.push(
      `responseTimeMs must be non-negative at questionIndex ${result.questionIndex}.`,
    );
  }

  if (replayBaseCount !== null && replayBaseCount < 0) {
    issues.push(
      `replayBaseCount must be non-negative at questionIndex ${result.questionIndex}.`,
    );
  }

  if (replayTargetCount !== null && replayTargetCount < 0) {
    issues.push(
      `replayTargetCount must be non-negative at questionIndex ${result.questionIndex}.`,
    );
  }

  const candidateDistances = getCandidateDistances(config);

  if (
    !skipConfigDependentChecks &&
    targetIntervalSemitones !== null &&
    !candidateDistances.includes(targetIntervalSemitones)
  ) {
    issues.push(
      `targetIntervalSemitones is not allowed by config at questionIndex ${result.questionIndex}.`,
    );
  }

  if (
    targetIntervalSemitones !== null &&
    answerIntervalSemitones !== null &&
    errorSemitones !== null &&
    answerIntervalSemitones - targetIntervalSemitones !== errorSemitones
  ) {
    issues.push(
      `errorSemitones must match answerIntervalSemitones - targetIntervalSemitones at questionIndex ${result.questionIndex}.`,
    );
  }

  if (
    baseNoteName &&
    baseMidi !== null &&
    getBaseMidi(baseNoteName) !== baseMidi
  ) {
    issues.push(
      `baseMidi must match baseNoteName at questionIndex ${result.questionIndex}.`,
    );
  }

  if (
    baseNoteName &&
    targetNoteName &&
    direction &&
    targetIntervalSemitones !== null &&
    targetNoteName !==
      shiftNote(baseNoteName, targetIntervalSemitones, direction)
  ) {
    issues.push(
      `targetNoteName must match base note, direction, and target interval at questionIndex ${result.questionIndex}.`,
    );
  }

  if (
    baseMidi !== null &&
    direction &&
    targetIntervalSemitones !== null &&
    targetMidi !== null &&
    targetMidi !==
      baseMidi + targetIntervalSemitones * directionFactor(direction)
  ) {
    issues.push(
      `targetMidi must match baseMidi, direction, and target interval at questionIndex ${result.questionIndex}.`,
    );
  }

  if (
    baseNoteName &&
    answerNoteName &&
    direction &&
    answerIntervalSemitones !== null &&
    answerNoteName !==
      shiftNote(baseNoteName, answerIntervalSemitones, direction)
  ) {
    issues.push(
      `answerNoteName must match base note, direction, and answer interval at questionIndex ${result.questionIndex}.`,
    );
  }

  if (
    baseMidi !== null &&
    direction &&
    answerIntervalSemitones !== null &&
    answerMidi !== null &&
    answerMidi !==
      baseMidi + answerIntervalSemitones * directionFactor(direction)
  ) {
    issues.push(
      `answerMidi must match baseMidi, direction, and answer interval at questionIndex ${result.questionIndex}.`,
    );
  }

  const normalizedErrorSemitones = errorSemitones ?? 0;
  const normalizedResponseTimeMs = responseTimeMs ?? 0;
  const normalizedTargetIntervalSemitones = targetIntervalSemitones ?? 0;

  return {
    questionIndex: index,
    presentedAt: presentedAt ?? result.presentedAt,
    answeredAt: answeredAt ?? result.answeredAt,
    mode,
    baseNoteName: baseNoteName ?? "C",
    baseMidi: baseMidi ?? getBaseMidi("C"),
    targetNoteName:
      baseNoteName && direction && targetIntervalSemitones !== null
        ? shiftNote(baseNoteName, targetIntervalSemitones, direction)
        : (targetNoteName ?? "C"),
    targetMidi:
      baseMidi !== null && direction && targetIntervalSemitones !== null
        ? baseMidi + targetIntervalSemitones * directionFactor(direction)
        : (targetMidi ?? getBaseMidi("C")),
    answerNoteName:
      baseNoteName && direction && answerIntervalSemitones !== null
        ? shiftNote(baseNoteName, answerIntervalSemitones, direction)
        : (answerNoteName ?? "C"),
    answerMidi:
      baseMidi !== null && direction && answerIntervalSemitones !== null
        ? baseMidi + answerIntervalSemitones * directionFactor(direction)
        : (answerMidi ?? getBaseMidi("C")),
    targetIntervalSemitones: normalizedTargetIntervalSemitones,
    answerIntervalSemitones: answerIntervalSemitones ?? 0,
    direction: direction ?? "up",
    isCorrect: isCorrectByErrorSemitones(normalizedErrorSemitones),
    errorSemitones: normalizedErrorSemitones,
    responseTimeMs: normalizedResponseTimeMs,
    replayBaseCount: replayBaseCount ?? 0,
    replayTargetCount: replayTargetCount ?? 0,
    score: calculateQuestionScoreV1({
      errorSemitones: normalizedErrorSemitones,
      responseTimeMs: normalizedResponseTimeMs,
      targetIntervalSemitones: normalizedTargetIntervalSemitones,
    }),
    scoreFormulaVersion: SCORE_FORMULA_VERSION_V1,
  };
}

function validateTrainingConfigByMode(config: TrainingConfig): string | null {
  if (config.mode === "distance") {
    return validateDistanceTrainingConfig(config);
  }

  return validateKeyboardTrainingConfig(config);
}

function trainingEndConditionsEqual(
  left: TrainingEndCondition,
  right: TrainingEndCondition,
): boolean {
  if (left.type === "question_count" && right.type === "question_count") {
    return left.questionCount === right.questionCount;
  }

  if (left.type === "time_limit" && right.type === "time_limit") {
    return left.timeLimitSeconds === right.timeLimitSeconds;
  }

  return false;
}

function normalizeIsoTimestamp(value: string): string | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeInteger(value: number): number | null {
  return Number.isInteger(value) ? value : null;
}

function normalizeNoteClass(value: string): NoteClass | null {
  return NOTE_CLASSES.includes(value as NoteClass)
    ? (value as NoteClass)
    : null;
}

function normalizeDirection(value: string): QuestionDirection | null {
  if (value === "up" || value === "down") {
    return value;
  }

  return null;
}

function getCandidateDistances(config: TrainingConfig): number[] {
  const distances: number[] = [];

  for (
    let semitone = config.intervalRange.minSemitone;
    semitone <= config.intervalRange.maxSemitone;
    semitone += 1
  ) {
    if (!config.includeUnison && semitone === 0) {
      continue;
    }

    if (!config.includeOctave && semitone === 12) {
      continue;
    }

    if (
      config.mode === "distance" &&
      config.intervalGranularity === "simple" &&
      ![0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12].includes(semitone)
    ) {
      continue;
    }

    distances.push(semitone);
  }

  return distances;
}

function getBaseMidi(noteClass: NoteClass): number {
  return 60 + NOTE_CLASSES.indexOf(noteClass);
}

function shiftNote(
  baseNote: NoteClass,
  intervalSemitones: number,
  direction: QuestionDirection,
): NoteClass {
  const startIndex = NOTE_CLASSES.indexOf(baseNote);
  const offset = direction === "up" ? intervalSemitones : -intervalSemitones;
  const shiftedIndex =
    (startIndex + offset + NOTE_CLASSES.length * 2) % NOTE_CLASSES.length;

  return NOTE_CLASSES[shiftedIndex];
}

function directionFactor(direction: QuestionDirection): -1 | 1 {
  return direction === "up" ? 1 : -1;
}

function validateProvidedTrainingConfig(value: unknown): string[] {
  const record = asRecord(value);

  if (!record) {
    return ["config is invalid."];
  }

  const issues: string[] = [];
  const intervalRange = asRecord(record.intervalRange);
  const minSemitone = readOptionalInteger(intervalRange, [
    "minSemitone",
    "minSemitones",
  ]);
  const maxSemitone = readOptionalInteger(intervalRange, [
    "maxSemitone",
    "maxSemitones",
  ]);

  if (minSemitone !== undefined && !isValidMinSemitone(minSemitone)) {
    issues.push("minSemitone must be between 0 and 11.");
  }

  const minForMax =
    minSemitone !== undefined && Number.isInteger(minSemitone)
      ? minSemitone
      : 0;

  if (
    maxSemitone !== undefined &&
    !isValidMaxSemitone(maxSemitone, minForMax)
  ) {
    issues.push(
      `maxSemitone must be between ${Math.max(1, minForMax)} and 12.`,
    );
  }

  issues.push(...validateProvidedTrainingEndCondition(record.endCondition));

  return issues;
}

function validateProvidedTrainingEndCondition(value: unknown): string[] {
  const record = asRecord(value);

  if (!record) {
    return [];
  }

  if (record.type === "question_count") {
    const questionCount = readOptionalInteger(record, ["questionCount"]);

    if (
      questionCount !== undefined &&
      (!Number.isInteger(questionCount) ||
        questionCount < 5 ||
        questionCount > 50)
    ) {
      return ["questionCount must be between 5 and 50."];
    }

    return [];
  }

  if (record.type === "time_limit") {
    const timeLimitSeconds = readOptionalInteger(record, ["timeLimitSeconds"]);
    const legacyTimeLimitMinutes = readOptionalInteger(record, [
      "timeLimitMinutes",
    ]);
    const normalizedSeconds =
      timeLimitSeconds ?? toLegacyTimeLimitSeconds(legacyTimeLimitMinutes);

    if (
      normalizedSeconds !== undefined &&
      (!Number.isInteger(normalizedSeconds) ||
        normalizedSeconds < 60 ||
        normalizedSeconds > 1800)
    ) {
      return ["timeLimitSeconds must be between 60 and 1800."];
    }
  }

  return [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readOptionalInteger(
  record: Record<string, unknown> | null,
  keys: string[],
): number | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    if (!(key in record)) {
      continue;
    }

    const numericValue = Number(record[key]);

    if (!Number.isInteger(numericValue)) {
      return Number.NaN;
    }

    return numericValue;
  }

  return undefined;
}

function isValidMinSemitone(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 11;
}

function isValidMaxSemitone(value: number, minSemitone: number): boolean {
  return (
    Number.isInteger(value) && value >= Math.max(1, minSemitone) && value <= 12
  );
}

function toLegacyTimeLimitSeconds(
  value: number | undefined,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value * 60;
}
