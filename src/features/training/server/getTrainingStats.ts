import { desc, eq } from "drizzle-orm";

import type { CurrentUserResolverDependencies } from "../../../lib/auth/server.ts";
import { resolveCurrentUserOrNull } from "../../../lib/auth/server.ts";
import {
  buildAnswerBiasSummary,
  buildDailyTrendSummaries,
  buildDirectionPerformance,
  buildIntervalPerformance,
  buildModeTrainingStats,
  buildRecentQuestionSummary,
  buildScoreTrendsByMode,
  buildTrainingOverview,
} from "../model/stats-aggregation.ts";
import type { QuestionDirection, TrainingMode } from "../model/types.ts";
import type { SelectOnlyDb } from "./query-types.ts";

interface RecentStatsSession {
  id: string;
  mode: TrainingMode;
  answeredQuestionCount: number;
  sessionScore: number;
  accuracyRate: number;
  endedAt: string;
}

interface PerformanceSummary {
  questionCount: number;
  correctRate: number;
  averageError: number;
  averageResponseTimeMs: number;
  averageScore: number;
}

interface DailyScoreTrendPoint {
  date: string;
  questionCount: number;
  averageScore: number;
}

export interface TrainingStats {
  isAuthenticated: boolean;
  totalSessions: number;
  totalSavedQuestionResults: number;
  overview: {
    questionCount: number;
    correctRate: number;
    averageError: number;
    medianError: number;
    averageResponseTimeMs: number;
    cumulativeScore: number;
  };
  byMode: Record<
    TrainingMode,
    {
      sessionCount: number;
      questionCount: number;
      correctRate: number;
      averageError: number;
      medianError: number;
      averageResponseTimeMs: number;
      cumulativeScore: number;
    }
  >;
  recentQuestionSummaries: {
    recent10: {
      questionCount: number;
      correctRate: number;
      averageScore: number;
      averageError: number;
      averageResponseTimeMs: number;
    };
    recent30: {
      questionCount: number;
      correctRate: number;
      averageScore: number;
      averageError: number;
      averageResponseTimeMs: number;
    };
  };
  intervalPerformance: Array<
    PerformanceSummary & {
      intervalSemitones: number;
    }
  >;
  directionPerformance: Record<QuestionDirection, PerformanceSummary>;
  answerBias: {
    higherCount: number;
    lowerCount: number;
    onTargetCount: number;
    higherRate: number;
    lowerRate: number;
    onTargetRate: number;
  };
  scoreTrends: {
    overall: DailyScoreTrendPoint[];
    distance: DailyScoreTrendPoint[];
    keyboard: DailyScoreTrendPoint[];
  };
  dailyTrends: Array<{
    date: string;
    questionCount: number;
    correctRate: number;
    averageScore: number;
    averageError: number;
    averageResponseTimeMs: number;
  }>;
  recentSessions: RecentStatsSession[];
}

export interface TrainingStatsDependencies {
  db?: SelectOnlyDb;
  currentUser?: CurrentUserResolverDependencies["currentUser"];
  getCurrentUser?: CurrentUserResolverDependencies["getCurrentUser"];
}

type AppSchemaModule = typeof import("../../../lib/db/schema/app.ts");

type StatsTables = {
  questionResults: AppSchemaModule["questionResults"];
  trainingSessions: AppSchemaModule["trainingSessions"];
};

interface StatsSessionRow {
  id: string;
  mode: TrainingMode;
  answeredQuestionCount: number;
  sessionScore: number | string;
  accuracyRate: number | string;
  avgErrorAbs: number | string;
  avgResponseTimeMs: number | string;
  endedAt: Date;
}

interface StatsQuestionResultRow {
  mode: TrainingMode;
  isCorrect: boolean;
  targetIntervalSemitones: number | string;
  direction: QuestionDirection;
  errorSemitones: number | string;
  responseTimeMs: number;
  score: number | string;
  answeredAt: Date;
}

export async function getTrainingStatsForCurrentUser(
  deps: TrainingStatsDependencies = {},
): Promise<TrainingStats> {
  const currentUser = await resolveCurrentUserOrNull(deps);

  if (!currentUser) {
    return {
      isAuthenticated: false,
      totalSessions: 0,
      totalSavedQuestionResults: 0,
      overview: {
        questionCount: 0,
        correctRate: 0,
        averageError: 0,
        medianError: 0,
        averageResponseTimeMs: 0,
        cumulativeScore: 0,
      },
      byMode: {
        distance: {
          sessionCount: 0,
          questionCount: 0,
          correctRate: 0,
          averageError: 0,
          medianError: 0,
          averageResponseTimeMs: 0,
          cumulativeScore: 0,
        },
        keyboard: {
          sessionCount: 0,
          questionCount: 0,
          correctRate: 0,
          averageError: 0,
          medianError: 0,
          averageResponseTimeMs: 0,
          cumulativeScore: 0,
        },
      },
      recentQuestionSummaries: {
        recent10: {
          questionCount: 0,
          correctRate: 0,
          averageScore: 0,
          averageError: 0,
          averageResponseTimeMs: 0,
        },
        recent30: {
          questionCount: 0,
          correctRate: 0,
          averageScore: 0,
          averageError: 0,
          averageResponseTimeMs: 0,
        },
      },
      intervalPerformance: [],
      directionPerformance: {
        up: {
          questionCount: 0,
          correctRate: 0,
          averageError: 0,
          averageResponseTimeMs: 0,
          averageScore: 0,
        },
        down: {
          questionCount: 0,
          correctRate: 0,
          averageError: 0,
          averageResponseTimeMs: 0,
          averageScore: 0,
        },
      },
      answerBias: {
        higherCount: 0,
        lowerCount: 0,
        onTargetCount: 0,
        higherRate: 0,
        lowerRate: 0,
        onTargetRate: 0,
      },
      scoreTrends: {
        overall: [],
        distance: [],
        keyboard: [],
      },
      dailyTrends: [],
      recentSessions: [],
    };
  }

  const db = (deps.db ?? (await getDb())) as SelectOnlyDb;
  const { questionResults, trainingSessions } = deps.db
    ? getPlaceholderStatsTables()
    : await getStatsTables();
  const allSessions = (await db
    .select({
      id: trainingSessions.id,
      mode: trainingSessions.mode,
      answeredQuestionCount: trainingSessions.answeredQuestionCount,
      sessionScore: trainingSessions.sessionScore,
      accuracyRate: trainingSessions.accuracyRate,
      avgErrorAbs: trainingSessions.avgErrorAbs,
      avgResponseTimeMs: trainingSessions.avgResponseTimeMs,
      endedAt: trainingSessions.endedAt,
    })
    .from(trainingSessions)
    .where(eq(trainingSessions.userId, currentUser.id))
    .orderBy(desc(trainingSessions.endedAt))) as StatsSessionRow[];
  const allQuestionResults = (await db
    .select({
      mode: questionResults.mode,
      isCorrect: questionResults.isCorrect,
      targetIntervalSemitones: questionResults.targetIntervalSemitones,
      direction: questionResults.direction,
      errorSemitones: questionResults.errorSemitones,
      responseTimeMs: questionResults.responseTimeMs,
      score: questionResults.score,
      answeredAt: questionResults.answeredAt,
    })
    .from(questionResults)
    .where(eq(questionResults.userId, currentUser.id))
    .orderBy(desc(questionResults.answeredAt))) as StatsQuestionResultRow[];

  const normalizedSessions = allSessions.map((session) => ({
    mode: session.mode,
    answeredQuestionCount: session.answeredQuestionCount,
    sessionScore: Number(session.sessionScore),
    avgErrorAbs: Number(session.avgErrorAbs),
    avgResponseTimeMs: Number(session.avgResponseTimeMs),
    endedAt: session.endedAt.toISOString(),
  }));
  const normalizedQuestionResults = allQuestionResults.map((result) => ({
    mode: result.mode,
    isCorrect: result.isCorrect,
    targetIntervalSemitones: Number(result.targetIntervalSemitones),
    direction: result.direction,
    errorSemitones: Number(result.errorSemitones),
    responseTimeMs: result.responseTimeMs,
    score: Number(result.score),
    answeredAt: result.answeredAt.toISOString(),
  }));
  const overview = buildTrainingOverview(
    normalizedSessions,
    normalizedQuestionResults,
  );
  const byMode = buildModeTrainingStats(
    normalizedSessions,
    normalizedQuestionResults,
  );

  return {
    isAuthenticated: true,
    totalSessions: allSessions.length,
    totalSavedQuestionResults: allQuestionResults.length,
    overview,
    byMode,
    recentQuestionSummaries: {
      recent10: buildRecentQuestionSummary(normalizedQuestionResults, 10),
      recent30: buildRecentQuestionSummary(normalizedQuestionResults, 30),
    },
    intervalPerformance: buildIntervalPerformance(normalizedQuestionResults),
    directionPerformance: buildDirectionPerformance(normalizedQuestionResults),
    answerBias: buildAnswerBiasSummary(normalizedQuestionResults),
    scoreTrends: buildScoreTrendsByMode(normalizedQuestionResults),
    dailyTrends: buildDailyTrendSummaries(normalizedQuestionResults),
    recentSessions: allSessions.slice(0, 10).map((session) => ({
      id: session.id,
      mode: session.mode,
      answeredQuestionCount: session.answeredQuestionCount,
      sessionScore: Number(session.sessionScore),
      accuracyRate: Number(session.accuracyRate),
      endedAt: session.endedAt.toISOString(),
    })),
  };
}

async function getDb() {
  const { getDb: resolveDb } = await import("../../../lib/db/client.ts");

  return resolveDb();
}

async function getStatsTables() {
  const { questionResults, trainingSessions } = await import(
    "../../../lib/db/schema/app.ts"
  );

  return { questionResults, trainingSessions };
}

function getPlaceholderStatsTables(): StatsTables {
  return {
    questionResults: {
      userId: "question_results.user_id",
      mode: "question_results.mode",
      isCorrect: "question_results.is_correct",
      targetIntervalSemitones: "question_results.target_interval_semitones",
      direction: "question_results.direction",
      errorSemitones: "question_results.error_semitones",
      responseTimeMs: "question_results.response_time_ms",
      score: "question_results.score",
      answeredAt: "question_results.answered_at",
    },
    trainingSessions: {
      id: "training_sessions.id",
      userId: "training_sessions.user_id",
      mode: "training_sessions.mode",
      answeredQuestionCount: "training_sessions.answered_question_count",
      sessionScore: "training_sessions.session_score",
      accuracyRate: "training_sessions.accuracy_rate",
      avgErrorAbs: "training_sessions.avg_error_abs",
      avgResponseTimeMs: "training_sessions.avg_response_time_ms",
      endedAt: "training_sessions.ended_at",
    },
  } as unknown as StatsTables;
}
