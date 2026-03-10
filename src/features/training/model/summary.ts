import type {
  SaveQuestionResultInput,
  SaveTrainingSessionSummaryInput,
} from "./types";

export interface BuildSessionSummaryOptions {
  plannedQuestionCount?: number;
}

export function buildSessionSummaryFromResults(
  results: SaveQuestionResultInput[],
  options: BuildSessionSummaryOptions = {},
): SaveTrainingSessionSummaryInput {
  const answeredQuestionCount = results.length;
  const correctQuestionCount = results.filter((result) => result.isCorrect).length;
  const sessionScore = sumBy(results, (result) => result.score);
  const totalErrorAbs = sumBy(results, (result) => Math.abs(result.errorSemitones));
  const totalResponseTimeMs = sumBy(results, (result) => result.responseTimeMs);

  return {
    plannedQuestionCount: options.plannedQuestionCount,
    answeredQuestionCount,
    correctQuestionCount,
    sessionScore: roundTo3(sessionScore),
    avgScorePerQuestion: averageOrZero(sessionScore, answeredQuestionCount),
    accuracyRate: averageOrZero(correctQuestionCount, answeredQuestionCount),
    avgErrorAbs: averageOrZero(totalErrorAbs, answeredQuestionCount),
    avgResponseTimeMs: averageOrZero(totalResponseTimeMs, answeredQuestionCount),
  };
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}

function averageOrZero(total: number, count: number): number {
  if (count === 0) {
    return 0;
  }

  return roundTo3(total / count);
}

function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
