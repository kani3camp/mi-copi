import { count, desc, eq } from "drizzle-orm";

import type { CurrentUser } from "../../../lib/auth/server.ts";
import { summarizeHomeHeadline } from "../model/stats-aggregation.ts";
import type { TrainingMode } from "../model/types.ts";

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

export interface HomeTrainingSummaryDependencies {
  db?: {
    select: (...args: unknown[]) => any;
  };
  getCurrentUser?: () => Promise<CurrentUser | null>;
}

export async function getHomeTrainingSummaryForCurrentUser(
  deps: HomeTrainingSummaryDependencies = {},
): Promise<HomeTrainingSummary> {
  const currentUser = await (deps.getCurrentUser ?? getCurrentUserOrNull)();

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

  const db = deps.db ?? (await getDb());
  const { questionResults, trainingSessions }: any = deps.db
    ? getPlaceholderHomeTables()
    : await getHomeTables();
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
    recentSessions.map((session: any) => ({
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
    recentSessions: recentSessions.map((session: any) => ({
      id: session.id,
      mode: session.mode,
      answeredQuestionCount: session.answeredQuestionCount,
      sessionScore: Number(session.sessionScore),
      accuracyRate: Number(session.accuracyRate),
      endedAt: session.endedAt.toISOString(),
    })),
  };
}

async function getCurrentUserOrNull(): Promise<CurrentUser | null> {
  const { getCurrentUserOrNull: resolveCurrentUserOrNull } = await import(
    "../../../lib/auth/server.ts"
  );

  return resolveCurrentUserOrNull();
}

async function getDb() {
  const { getDb: resolveDb } = await import("../../../lib/db/client.ts");

  return resolveDb();
}

async function getHomeTables() {
  const { questionResults, trainingSessions } = await import(
    "../../../lib/db/schema/app.ts"
  );

  return { questionResults, trainingSessions };
}

function getPlaceholderHomeTables() {
  return {
    questionResults: {
      userId: "question_results.user_id",
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
  };
}
