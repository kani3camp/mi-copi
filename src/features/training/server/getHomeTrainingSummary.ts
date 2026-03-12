import { count, desc, eq } from "drizzle-orm";

import type { CurrentUserResolverDependencies } from "../../../lib/auth/server.ts";
import { resolveCurrentUserOrNull } from "../../../lib/auth/server.ts";
import { summarizeHomeHeadline } from "../model/stats-aggregation.ts";
import type { TrainingMode } from "../model/types.ts";
import type { SelectOnlyDb } from "./query-types.ts";

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
  db?: SelectOnlyDb;
  currentUser?: CurrentUserResolverDependencies["currentUser"];
  getCurrentUser?: CurrentUserResolverDependencies["getCurrentUser"];
}

type AppSchemaModule = typeof import("../../../lib/db/schema/app.ts");

type HomeTables = {
  questionResults: AppSchemaModule["questionResults"];
  trainingSessions: AppSchemaModule["trainingSessions"];
};

interface CountRow {
  count: number;
}

interface RecentSessionRow {
  id: string;
  mode: TrainingMode;
  answeredQuestionCount: number;
  sessionScore: number | string;
  accuracyRate: number | string;
  avgErrorAbs: number | string;
  avgResponseTimeMs: number | string;
  endedAt: Date;
}

export async function getHomeTrainingSummaryForCurrentUser(
  deps: HomeTrainingSummaryDependencies = {},
): Promise<HomeTrainingSummary> {
  const currentUser = await resolveCurrentUserOrNull(deps);

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

  const db = (deps.db ?? (await getDb())) as SelectOnlyDb;
  const { questionResults, trainingSessions } = deps.db
    ? getPlaceholderHomeTables()
    : await getHomeTables();
  const [sessionCountRow] = (await db
    .select({ count: count() })
    .from(trainingSessions)
    .where(eq(trainingSessions.userId, currentUser.id))) as CountRow[];
  const [questionResultCountRow] = (await db
    .select({ count: count() })
    .from(questionResults)
    .where(eq(questionResults.userId, currentUser.id))) as CountRow[];
  const recentSessions = (await db
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
    .limit(5)) as RecentSessionRow[];
  const headlineSummary = summarizeHomeHeadline(
    recentSessions.map((session) => ({
      mode: session.mode,
      answeredQuestionCount: session.answeredQuestionCount,
      sessionScore: Number(session.sessionScore),
      avgErrorAbs: Number(session.avgErrorAbs),
      avgResponseTimeMs: Number(session.avgResponseTimeMs),
      endedAt: session.endedAt.toISOString(),
    })),
  );

  return {
    isAuthenticated: true,
    totalSessions: Number(sessionCountRow?.count ?? 0),
    totalSavedQuestionResults: Number(questionResultCountRow?.count ?? 0),
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

function getPlaceholderHomeTables(): HomeTables {
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
  } as unknown as HomeTables;
}
