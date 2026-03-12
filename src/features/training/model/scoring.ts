import type { ScoreFormulaVersion } from "./types";

export const SCORE_FORMULA_VERSION_V1: ScoreFormulaVersion = "v1";

export interface QuestionScoreV1Input {
  errorSemitones: number;
  responseTimeMs: number;
  targetIntervalSemitones: number;
}

export function calculateQuestionScoreV1(input: QuestionScoreV1Input): number {
  return roundTo3(
    100 *
      errorMultiplier(Math.abs(input.errorSemitones)) *
      timeMultiplier(input.responseTimeMs) *
      intervalDifficultyMultiplier(Math.abs(input.targetIntervalSemitones)),
  );
}

export function isCorrectByErrorSemitones(errorSemitones: number): boolean {
  return errorSemitones === 0;
}

export function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function errorMultiplier(errorSemitonesAbs: number): number {
  if (errorSemitonesAbs === 0) {
    return 1;
  }

  if (errorSemitonesAbs === 1) {
    return 0.55;
  }

  if (errorSemitonesAbs === 2) {
    return 0.25;
  }

  return 0;
}

function timeMultiplier(responseTimeMs: number): number {
  if (responseTimeMs <= 2000) {
    return 1.2;
  }

  if (responseTimeMs <= 4000) {
    return 1;
  }

  if (responseTimeMs <= 7000) {
    return 0.85;
  }

  return 0.7;
}

function intervalDifficultyMultiplier(
  targetIntervalSemitonesAbs: number,
): number {
  if (targetIntervalSemitonesAbs === 0) {
    return 1;
  }

  if (targetIntervalSemitonesAbs <= 2) {
    return 1.05;
  }

  if (targetIntervalSemitonesAbs <= 4) {
    return 1.1;
  }

  if (targetIntervalSemitonesAbs === 5) {
    return 1.18;
  }

  if (targetIntervalSemitonesAbs <= 7) {
    return 1.26;
  }

  if (targetIntervalSemitonesAbs <= 9) {
    return 1.36;
  }

  if (targetIntervalSemitonesAbs <= 11) {
    return 1.48;
  }

  return 1.6;
}
