import { and, asc, eq } from "drizzle-orm";

import type { CurrentUser } from "../../../lib/auth/server.ts";
import { normalizeTrainingConfigOrDefault } from "../model/config.ts";
import type {
  NoteClass,
  QuestionDirection,
  TrainingConfigSnapshot,
  TrainingMode,
} from "../model/types.ts";

export interface TrainingSessionDetailQuestionResult {
  id: string;
  questionIndex: number;
  baseNoteName: NoteClass;
  targetNoteName: NoteClass;
  answerNoteName: NoteClass;
  targetIntervalSemitones: number;
  answerIntervalSemitones: number;
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

export interface TrainingSessionDetailDependencies {
  db?: {
    select: (...args: unknown[]) => any;
  };
  getCurrentUser?: () => Promise<CurrentUser | null>;
}

export async function getTrainingSessionDetailForCurrentUser(
  sessionId: string,
  deps: TrainingSessionDetailDependencies = {},
): Promise<TrainingSessionDetail | null> {
  const currentUser = await (deps.getCurrentUser ?? getCurrentUserOrNull)();

  if (!currentUser || !isUuid(sessionId)) {
    return null;
  }

  const db = deps.db ?? (await getDb());
  const { questionResults, trainingSessions }: any = deps.db
    ? getPlaceholderSessionDetailTables()
    : await getSessionDetailTables();
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
      targetIntervalSemitones: questionResults.targetIntervalSemitones,
      answerIntervalSemitones: questionResults.answerIntervalSemitones,
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
    configSnapshot: normalizeTrainingConfigOrDefault(
      session.configSnapshot,
      session.mode,
    ),
    createdAt: session.createdAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    answeredQuestionCount: session.answeredQuestionCount,
    correctQuestionCount: session.correctQuestionCount,
    accuracyRate: Number(session.accuracyRate),
    avgErrorAbs: Number(session.avgErrorAbs),
    avgResponseTimeMs: Number(session.avgResponseTimeMs),
    sessionScore: Number(session.sessionScore),
    results: results.map((result: any) => ({
      id: result.id,
      questionIndex: result.questionIndex,
      baseNoteName: result.baseNoteName,
      targetNoteName: result.targetNoteName,
      answerNoteName: result.answerNoteName,
      targetIntervalSemitones: Number(result.targetIntervalSemitones),
      answerIntervalSemitones: Number(result.answerIntervalSemitones),
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

async function getSessionDetailTables() {
  const { questionResults, trainingSessions } = await import(
    "../../../lib/db/schema/app.ts"
  );

  return { questionResults, trainingSessions };
}

function getPlaceholderSessionDetailTables() {
  return {
    questionResults: {
      id: "question_results.id",
      trainingSessionId: "question_results.training_session_id",
      userId: "question_results.user_id",
      questionIndex: "question_results.question_index",
      baseNoteName: "question_results.base_note_name",
      targetNoteName: "question_results.target_note_name",
      answerNoteName: "question_results.answer_note_name",
      targetIntervalSemitones: "question_results.target_interval_semitones",
      answerIntervalSemitones: "question_results.answer_interval_semitones",
      direction: "question_results.direction",
      isCorrect: "question_results.is_correct",
      errorSemitones: "question_results.error_semitones",
      responseTimeMs: "question_results.response_time_ms",
    },
    trainingSessions: {
      id: "training_sessions.id",
      userId: "training_sessions.user_id",
      mode: "training_sessions.mode",
      configSnapshot: "training_sessions.config_snapshot",
      createdAt: "training_sessions.created_at",
      endedAt: "training_sessions.ended_at",
      answeredQuestionCount: "training_sessions.answered_question_count",
      correctQuestionCount: "training_sessions.correct_question_count",
      accuracyRate: "training_sessions.accuracy_rate",
      avgErrorAbs: "training_sessions.avg_error_abs",
      avgResponseTimeMs: "training_sessions.avg_response_time_ms",
      sessionScore: "training_sessions.session_score",
    },
  };
}
