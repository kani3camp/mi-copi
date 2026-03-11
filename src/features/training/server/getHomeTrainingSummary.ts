import { count, desc, eq } from "drizzle-orm";

import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { getDb } from "../../../lib/db/client";
import { questionResults, trainingSessions } from "../../../lib/db/schema/app";
import { summarizeHomeHeadline } from "../model/stats-aggregation";
import type { TrainingMode } from "../model/types";

export interface RecentTrainingSessionSummary {
  id: string;
  mode: TrainingMode;
  answeredQuestionCount: number;
  sessionScore: number;
  accuracyRate: number;
  endedAt: string;
}

export interface HomeTrainingSummary {
  isAuthenticated: boolean;
  totalSessions: number;
  totalSavedQuestionResults: number;
  lastTrainingTime: string | null;
  lastUsedMode: TrainingMode | null;
  latestSessionScore: number | null;
  recentAverageError: number | null;
  recentAverageResponseTimeMs: number | null;
  recentSessions: RecentTrainingSessionSummary[];
}

export async function getHomeTrainingSummaryForCurrentUser(): Promise<HomeTrainingSummary> {
  const currentUser = await getCurrentUserOrNull();

  if (!currentUser) {
    return {
      isAuthenticated: false,
      totalSessions: 0,
      totalSavedQuestionResults: 0,
      lastTrainingTime: null,
      lastUsedMode: null,
      latestSessionScore: null,
      recentAverageError: null,
      recentAverageResponseTimeMs: null,
      recentSessions: [],
    };
  }

  const db = getDb();
  const [sessionCountRow] = await db
    .select({ count: count() })
    .from(trainingSessions)
    .where(eq(trainingSessions.userId, currentUser.id));
  const [questionResultCountRow] = await db
    .select({ count: count() })
    .from(questionResults)
    .where(eq(questionResults.userId, currentUser.id));
  const recentSessions = await db
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
    .orderBy(desc(trainingSessions.endedAt))
    .limit(5);
  const headlineSummary = summarizeHomeHeadline(
    recentSessions.map((session) => ({
      mode: session.mode,
      answeredQuestionCount: session.answeredQuestionCount,
      sessionScore: session.sessionScore,
      avgErrorAbs: session.avgErrorAbs,
      avgResponseTimeMs: session.avgResponseTimeMs,
      endedAt: session.endedAt.toISOString(),
    })),
  );

  return {
    isAuthenticated: true,
    totalSessions: sessionCountRow?.count ?? 0,
    totalSavedQuestionResults: questionResultCountRow?.count ?? 0,
    lastTrainingTime: headlineSummary.lastTrainingTime,
    lastUsedMode: headlineSummary.lastUsedMode,
    latestSessionScore: headlineSummary.latestSessionScore,
    recentAverageError: headlineSummary.recentAverageError,
    recentAverageResponseTimeMs: headlineSummary.recentAverageResponseTimeMs,
    recentSessions: recentSessions.map((session) => ({
      id: session.id,
      mode: session.mode,
      answeredQuestionCount: session.answeredQuestionCount,
      sessionScore: Number(session.sessionScore),
      accuracyRate: Number(session.accuracyRate),
      endedAt: session.endedAt.toISOString(),
    })),
  };
}
