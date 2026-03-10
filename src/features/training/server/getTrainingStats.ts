import { count, desc, eq } from "drizzle-orm";

import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { getDb } from "../../../lib/db/client";
import {
  questionResults,
  trainingSessions,
} from "../../../lib/db/schema/app";
import type { TrainingMode } from "../model/types";

interface RecentStatsSession {
  id: string;
  mode: TrainingMode;
  sessionScore: number;
  accuracyRate: number;
  createdAt: string;
}

interface ModeStats {
  sessionCount: number;
  averageScore: number;
}

export interface TrainingStats {
  isAuthenticated: boolean;
  totalSessions: number;
  totalSavedQuestionResults: number;
  byMode: Record<TrainingMode, ModeStats>;
  recentSessions: RecentStatsSession[];
}

export async function getTrainingStatsForCurrentUser(): Promise<TrainingStats> {
  const currentUser = await getCurrentUserOrNull();

  if (!currentUser) {
    return {
      isAuthenticated: false,
      totalSessions: 0,
      totalSavedQuestionResults: 0,
      byMode: {
        distance: { sessionCount: 0, averageScore: 0 },
        keyboard: { sessionCount: 0, averageScore: 0 },
      },
      recentSessions: [],
    };
  }

  const db = getDb();
  const [questionResultCountRow] = await db
    .select({ count: count() })
    .from(questionResults)
    .where(eq(questionResults.userId, currentUser.id));
  const allSessions = await db
    .select({
      id: trainingSessions.id,
      mode: trainingSessions.mode,
      sessionScore: trainingSessions.sessionScore,
      accuracyRate: trainingSessions.accuracyRate,
      createdAt: trainingSessions.createdAt,
    })
    .from(trainingSessions)
    .where(eq(trainingSessions.userId, currentUser.id))
    .orderBy(desc(trainingSessions.createdAt));

  const byMode = buildModeStats(allSessions);

  return {
    isAuthenticated: true,
    totalSessions: allSessions.length,
    totalSavedQuestionResults: questionResultCountRow?.count ?? 0,
    byMode,
    recentSessions: allSessions.slice(0, 10).map((session) => ({
      id: session.id,
      mode: session.mode,
      sessionScore: Number(session.sessionScore),
      accuracyRate: Number(session.accuracyRate),
      createdAt: session.createdAt.toISOString(),
    })),
  };
}

function buildModeStats(
  sessions: Array<{
    mode: TrainingMode;
    sessionScore: string;
  }>,
): Record<TrainingMode, ModeStats> {
  const stats: Record<TrainingMode, { count: number; totalScore: number }> = {
    distance: { count: 0, totalScore: 0 },
    keyboard: { count: 0, totalScore: 0 },
  };

  for (const session of sessions) {
    stats[session.mode].count += 1;
    stats[session.mode].totalScore += Number(session.sessionScore);
  }

  return {
    distance: {
      sessionCount: stats.distance.count,
      averageScore: averageOrZero(
        stats.distance.totalScore,
        stats.distance.count,
      ),
    },
    keyboard: {
      sessionCount: stats.keyboard.count,
      averageScore: averageOrZero(
        stats.keyboard.totalScore,
        stats.keyboard.count,
      ),
    },
  };
}

function averageOrZero(total: number, count: number): number {
  if (count === 0) {
    return 0;
  }

  return Math.round((total / count) * 1000) / 1000;
}
