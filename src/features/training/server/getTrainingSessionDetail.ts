import { and, asc, eq } from "drizzle-orm";

import { getCurrentUserOrNull } from "../../../lib/auth/server";
import { getDb } from "../../../lib/db/client";
import { questionResults, trainingSessions } from "../../../lib/db/schema/app";
import type {
  NoteClass,
  QuestionDirection,
  TrainingConfigSnapshot,
  TrainingMode,
} from "../model/types";

export interface TrainingSessionDetailQuestionResult {
  id: string;
  questionIndex: number;
  baseNoteName: NoteClass;
  targetNoteName: NoteClass;
  answerNoteName: NoteClass;
  direction: QuestionDirection;
  isCorrect: boolean;
  errorSemitones: number;
  responseTimeMs: number;
}

export interface TrainingSessionDetail {
  id: string;
  mode: TrainingMode;
  configSnapshot: TrainingConfigSnapshot;
  createdAt: string;
  endedAt: string;
  answeredQuestionCount: number;
  correctQuestionCount: number;
  accuracyRate: number;
  avgErrorAbs: number;
  avgResponseTimeMs: number;
  sessionScore: number;
  results: TrainingSessionDetailQuestionResult[];
}

export async function getTrainingSessionDetailForCurrentUser(
  sessionId: string,
): Promise<TrainingSessionDetail | null> {
  const currentUser = await getCurrentUserOrNull();

  if (!currentUser || !isUuid(sessionId)) {
    return null;
  }

  const db = getDb();
  const [session] = await db
    .select({
      id: trainingSessions.id,
      mode: trainingSessions.mode,
      configSnapshot: trainingSessions.configSnapshot,
      createdAt: trainingSessions.createdAt,
      endedAt: trainingSessions.endedAt,
      answeredQuestionCount: trainingSessions.answeredQuestionCount,
      correctQuestionCount: trainingSessions.correctQuestionCount,
      accuracyRate: trainingSessions.accuracyRate,
      avgErrorAbs: trainingSessions.avgErrorAbs,
      avgResponseTimeMs: trainingSessions.avgResponseTimeMs,
      sessionScore: trainingSessions.sessionScore,
    })
    .from(trainingSessions)
    .where(
      and(
        eq(trainingSessions.id, sessionId),
        eq(trainingSessions.userId, currentUser.id),
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  const results = await db
    .select({
      id: questionResults.id,
      questionIndex: questionResults.questionIndex,
      baseNoteName: questionResults.baseNoteName,
      targetNoteName: questionResults.targetNoteName,
      answerNoteName: questionResults.answerNoteName,
      direction: questionResults.direction,
      isCorrect: questionResults.isCorrect,
      errorSemitones: questionResults.errorSemitones,
      responseTimeMs: questionResults.responseTimeMs,
    })
    .from(questionResults)
    .where(
      and(
        eq(questionResults.trainingSessionId, sessionId),
        eq(questionResults.userId, currentUser.id),
      ),
    )
    .orderBy(asc(questionResults.questionIndex));

  return {
    id: session.id,
    mode: session.mode,
    configSnapshot: session.configSnapshot,
    createdAt: session.createdAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    answeredQuestionCount: session.answeredQuestionCount,
    correctQuestionCount: session.correctQuestionCount,
    accuracyRate: Number(session.accuracyRate),
    avgErrorAbs: Number(session.avgErrorAbs),
    avgResponseTimeMs: Number(session.avgResponseTimeMs),
    sessionScore: Number(session.sessionScore),
    results: results.map((result) => ({
      id: result.id,
      questionIndex: result.questionIndex,
      baseNoteName: result.baseNoteName,
      targetNoteName: result.targetNoteName,
      answerNoteName: result.answerNoteName,
      direction: result.direction,
      isCorrect: result.isCorrect,
      errorSemitones: Number(result.errorSemitones),
      responseTimeMs: result.responseTimeMs,
    })),
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
