import { count, desc, eq } from "drizzle-orm";

import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { getDb } from "../../../lib/db/client";
import { questionResults, trainingSessions } from "../../../lib/db/schema/app";
import type { TrainingMode } from "../model/types";

export interface RecentTrainingSessionSummary {
  id: string;
  mode: TrainingMode;
  answeredQuestionCount: number;
  sessionScore: number;
  accuracyRate: number;
  createdAt: string;
}

export interface HomeTrainingSummary {
  isAuthenticated: boolean;
  totalSessions: number;
  totalSavedQuestionResults: number;
  recentSessions: RecentTrainingSessionSummary[];
}

export async function getHomeTrainingSummaryForCurrentUser(): Promise<HomeTrainingSummary> {
  const currentUser = await getCurrentUserOrNull();

  if (!currentUser) {
    return {
      isAuthenticated: false,
      totalSessions: 0,
      totalSavedQuestionResults: 0,
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
      createdAt: trainingSessions.createdAt,
    })
    .from(trainingSessions)
    .where(eq(trainingSessions.userId, currentUser.id))
    .orderBy(desc(trainingSessions.createdAt))
    .limit(5);

  return {
    isAuthenticated: true,
    totalSessions: sessionCountRow?.count ?? 0,
    totalSavedQuestionResults: questionResultCountRow?.count ?? 0,
    recentSessions: recentSessions.map((session) => ({
      id: session.id,
      mode: session.mode,
      answeredQuestionCount: session.answeredQuestionCount,
      sessionScore: Number(session.sessionScore),
      accuracyRate: Number(session.accuracyRate),
      createdAt: session.createdAt.toISOString(),
    })),
  };
}
