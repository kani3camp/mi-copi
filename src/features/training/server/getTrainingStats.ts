import { desc, eq } from "drizzle-orm";

import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { getDb } from "../../../lib/db/client";
import { questionResults, trainingSessions } from "../../../lib/db/schema/app";
import {
  buildModeTrainingStats,
  buildRecentQuestionSummary,
  buildTrainingOverview,
} from "../model/stats-aggregation";
import type { TrainingMode } from "../model/types";

interface RecentStatsSession {
  id: string;
  mode: TrainingMode;
  answeredQuestionCount: number;
  sessionScore: number;
  accuracyRate: number;
  endedAt: string;
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
  recentSessions: RecentStatsSession[];
}

export async function getTrainingStatsForCurrentUser(): Promise<TrainingStats> {
  const currentUser = await getCurrentUserOrNull();

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
      recentSessions: [],
    };
  }

  const db = getDb();
  const allSessions = await db
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
    .orderBy(desc(trainingSessions.endedAt));
  const allQuestionResults = await db
    .select({
      mode: questionResults.mode,
      isCorrect: questionResults.isCorrect,
      errorSemitones: questionResults.errorSemitones,
      responseTimeMs: questionResults.responseTimeMs,
      score: questionResults.score,
      answeredAt: questionResults.answeredAt,
    })
    .from(questionResults)
    .where(eq(questionResults.userId, currentUser.id))
    .orderBy(desc(questionResults.answeredAt));

  const normalizedSessions = allSessions.map((session) => ({
    mode: session.mode,
    answeredQuestionCount: session.answeredQuestionCount,
    sessionScore: session.sessionScore,
    avgErrorAbs: session.avgErrorAbs,
    avgResponseTimeMs: session.avgResponseTimeMs,
    endedAt: session.endedAt.toISOString(),
  }));
  const normalizedQuestionResults = allQuestionResults.map((result) => ({
    mode: result.mode,
    isCorrect: result.isCorrect,
    errorSemitones: result.errorSemitones,
    responseTimeMs: result.responseTimeMs,
    score: result.score,
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
