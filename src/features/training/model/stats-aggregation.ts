import type { TrainingMode } from "./types";

type NumericLike = number | string;

export interface AggregatableSessionMetrics {
  mode: TrainingMode;
  answeredQuestionCount: number;
  sessionScore: NumericLike;
  avgErrorAbs: NumericLike;
  avgResponseTimeMs: NumericLike;
  endedAt: string;
}

export interface AggregatableQuestionMetrics {
  mode: TrainingMode;
  isCorrect: boolean;
  errorSemitones: NumericLike;
  responseTimeMs: NumericLike;
  score: NumericLike;
  answeredAt: string;
}

export interface TrainingOverviewMetrics {
  questionCount: number;
  correctRate: number;
  averageError: number;
  medianError: number;
  averageResponseTimeMs: number;
  cumulativeScore: number;
}

export interface RecentQuestionSummary {
  questionCount: number;
  correctRate: number;
  averageScore: number;
  averageError: number;
  averageResponseTimeMs: number;
}

export interface DailyTrendSummary {
  date: string;
  questionCount: number;
  correctRate: number;
  averageScore: number;
  averageError: number;
  averageResponseTimeMs: number;
}

export interface ModeTrainingStats extends TrainingOverviewMetrics {
  sessionCount: number;
}

export interface HomeHeadlineSummary {
  lastTrainingTime: string | null;
  lastUsedMode: TrainingMode | null;
  latestSessionScore: number | null;
  recentAverageError: number | null;
  recentAverageResponseTimeMs: number | null;
}

export function summarizeHomeHeadline(
  sessionsInRecentOrder: AggregatableSessionMetrics[],
): HomeHeadlineSummary {
  const [latestSession] = sessionsInRecentOrder;

  if (!latestSession) {
    return {
      lastTrainingTime: null,
      lastUsedMode: null,
      latestSessionScore: null,
      recentAverageError: null,
      recentAverageResponseTimeMs: null,
    };
  }

  return {
    lastTrainingTime: latestSession.endedAt,
    lastUsedMode: latestSession.mode,
    latestSessionScore: toNumber(latestSession.sessionScore),
    recentAverageError: averageOrNull(
      sessionsInRecentOrder.map((session) => toNumber(session.avgErrorAbs)),
    ),
    recentAverageResponseTimeMs: averageOrNull(
      sessionsInRecentOrder.map((session) =>
        toNumber(session.avgResponseTimeMs),
      ),
    ),
  };
}

export function buildTrainingOverview(
  sessions: AggregatableSessionMetrics[],
  questionResults: AggregatableQuestionMetrics[],
  mode?: TrainingMode,
): TrainingOverviewMetrics {
  const filteredSessions = mode
    ? sessions.filter((session) => session.mode === mode)
    : sessions;
  const filteredQuestionResults = mode
    ? questionResults.filter((result) => result.mode === mode)
    : questionResults;

  const errorValues = filteredQuestionResults.map((result) =>
    Math.abs(toNumber(result.errorSemitones)),
  );

  return {
    questionCount: filteredQuestionResults.length,
    correctRate: ratioOrZero(
      filteredQuestionResults.filter((result) => result.isCorrect).length,
      filteredQuestionResults.length,
    ),
    averageError: averageOrZero(errorValues),
    medianError: medianOrZero(errorValues),
    averageResponseTimeMs: averageOrZero(
      filteredQuestionResults.map((result) => toNumber(result.responseTimeMs)),
    ),
    cumulativeScore: roundTo3(
      filteredSessions.reduce(
        (sum, session) => sum + toNumber(session.sessionScore),
        0,
      ),
    ),
  };
}

export function buildModeTrainingStats(
  sessions: AggregatableSessionMetrics[],
  questionResults: AggregatableQuestionMetrics[],
): Record<TrainingMode, ModeTrainingStats> {
  return {
    distance: {
      sessionCount: sessions.filter((session) => session.mode === "distance")
        .length,
      ...buildTrainingOverview(sessions, questionResults, "distance"),
    },
    keyboard: {
      sessionCount: sessions.filter((session) => session.mode === "keyboard")
        .length,
      ...buildTrainingOverview(sessions, questionResults, "keyboard"),
    },
  };
}

export function buildRecentQuestionSummary(
  questionResultsInRecentOrder: AggregatableQuestionMetrics[],
  size: number,
): RecentQuestionSummary {
  const recentResults = questionResultsInRecentOrder.slice(0, size);

  return {
    questionCount: recentResults.length,
    correctRate: ratioOrZero(
      recentResults.filter((result) => result.isCorrect).length,
      recentResults.length,
    ),
    averageScore: averageOrZero(
      recentResults.map((result) => toNumber(result.score)),
    ),
    averageError: averageOrZero(
      recentResults.map((result) => Math.abs(toNumber(result.errorSemitones))),
    ),
    averageResponseTimeMs: averageOrZero(
      recentResults.map((result) => toNumber(result.responseTimeMs)),
    ),
  };
}

export function buildDailyTrendSummaries(
  questionResultsInRecentOrder: AggregatableQuestionMetrics[],
): DailyTrendSummary[] {
  const byDate = new Map<string, AggregatableQuestionMetrics[]>();

  for (const result of questionResultsInRecentOrder) {
    const dateKey = toIsoDate(result.answeredAt);
    const dateBucket = byDate.get(dateKey);

    if (dateBucket) {
      dateBucket.push(result);
      continue;
    }

    byDate.set(dateKey, [result]);
  }

  return [...byDate.entries()]
    .sort(([leftDate], [rightDate]) => rightDate.localeCompare(leftDate))
    .map(([date, results]) => ({
      date,
      questionCount: results.length,
      correctRate: ratioOrZero(
        results.filter((result) => result.isCorrect).length,
        results.length,
      ),
      averageScore: averageOrZero(
        results.map((result) => toNumber(result.score)),
      ),
      averageError: averageOrZero(
        results.map((result) => Math.abs(toNumber(result.errorSemitones))),
      ),
      averageResponseTimeMs: averageOrZero(
        results.map((result) => toNumber(result.responseTimeMs)),
      ),
    }));
}

function toNumber(value: NumericLike): number {
  return Number(value);
}

function toIsoDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function averageOrNull(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return averageOrZero(values);
}

function averageOrZero(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return roundTo3(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function medianOrZero(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 1) {
    return roundTo3(sortedValues[middleIndex]);
  }

  return roundTo3(
    (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2,
  );
}

function ratioOrZero(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return roundTo3(numerator / denominator);
}

function roundTo3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
