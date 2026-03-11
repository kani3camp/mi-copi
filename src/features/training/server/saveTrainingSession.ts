"use server";

import {
  toQuestionResultInserts,
  toTrainingSessionInsert,
} from "../model/persistence";
import type {
  QuestionResultInsertShape,
  SaveTrainingSessionInput,
  SessionEndConditionType,
  SessionFinishReason,
  TrainingSessionInsertShape,
} from "../model/types";

const SESSION_FINISH_REASONS = [
  "target_reached",
  "time_up",
  "manual_end",
] as const satisfies readonly SessionFinishReason[];

const SESSION_END_CONDITION_TYPES = [
  "question_count",
  "time_limit",
] as const satisfies readonly SessionEndConditionType[];

export type SaveTrainingSessionErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "SAVE_FAILED";

export type SaveTrainingSessionResult =
  | {
      ok: true;
      sessionId: string;
      savedQuestionCount: number;
    }
  | {
      ok: false;
      code: SaveTrainingSessionErrorCode;
      message: string;
    };

export interface PersistedTrainingSessionInsert
  extends TrainingSessionInsertShape {
  id: string;
  createdAt: string;
}

export interface PersistedQuestionResultInsert
  extends QuestionResultInsertShape {
  createdAt: string;
}

export interface SaveTrainingSessionTx {
  insertTrainingSession(values: PersistedTrainingSessionInsert): Promise<void>;
  insertQuestionResults(values: PersistedQuestionResultInsert[]): Promise<void>;
}

export interface SaveTrainingSessionDb {
  transaction<T>(
    callback: (tx: SaveTrainingSessionTx) => Promise<T>,
  ): Promise<T>;
}

export interface SaveTrainingSessionDependencies {
  db: SaveTrainingSessionDb;
  generateSessionId?: () => string;
  now?: () => Date;
}

export async function saveTrainingSession(
  userId: string,
  input: SaveTrainingSessionInput,
  deps: SaveTrainingSessionDependencies,
): Promise<SaveTrainingSessionResult> {
  if (!userId) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Authenticated user is required to save a training session.",
    };
  }

  const issues = validateSaveTrainingSessionInput(input);

  if (issues.length > 0) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: issues.join(" "),
    };
  }

  const sessionId = deps.generateSessionId?.() ?? crypto.randomUUID();
  const createdAt = (deps.now?.() ?? new Date()).toISOString();
  const trainingSessionInsert = toTrainingSessionInsert(input, userId);
  const questionResultInserts = toQuestionResultInserts(
    input,
    sessionId,
    userId,
  );

  try {
    await deps.db.transaction(async (tx) => {
      await tx.insertTrainingSession(
        buildTrainingSessionInsertRow(
          trainingSessionInsert,
          sessionId,
          createdAt,
        ),
      );
      await tx.insertQuestionResults(
        buildQuestionResultInsertRows(questionResultInserts, createdAt),
      );
    });
  } catch {
    return {
      ok: false,
      code: "SAVE_FAILED",
      message: "Failed to persist the training session.",
    };
  }

  return {
    ok: true,
    sessionId,
    savedQuestionCount: questionResultInserts.length,
  };
}

function validateSaveTrainingSessionInput(
  input: SaveTrainingSessionInput,
): string[] {
  const issues: string[] = [];

  if (input.results.length === 0) {
    issues.push("At least one answered question result is required.");
  }

  if (input.summary.answeredQuestionCount !== input.results.length) {
    issues.push("answeredQuestionCount must match results.length.");
  }

  if (
    input.summary.correctQuestionCount > input.summary.answeredQuestionCount
  ) {
    issues.push("correctQuestionCount cannot exceed answeredQuestionCount.");
  }

  if (!isSessionFinishReason(input.finishReason)) {
    issues.push("finishReason is invalid.");
  }

  if (!isSessionEndConditionType(input.endCondition.type)) {
    issues.push("endCondition.type is invalid.");
  }

  return issues;
}

function buildTrainingSessionInsertRow(
  insert: TrainingSessionInsertShape,
  sessionId: string,
  createdAt: string,
): PersistedTrainingSessionInsert {
  return {
    id: sessionId,
    userId: insert.userId,
    mode: insert.mode,
    startedAt: insert.startedAt,
    endedAt: insert.endedAt,
    finishReason: insert.finishReason,
    endConditionType: insert.endConditionType,
    plannedQuestionCount: insert.plannedQuestionCount,
    plannedTimeLimitSeconds: insert.plannedTimeLimitSeconds,
    answeredQuestionCount: insert.answeredQuestionCount,
    correctQuestionCount: insert.correctQuestionCount,
    sessionScore: insert.sessionScore,
    avgScorePerQuestion: insert.avgScorePerQuestion,
    accuracyRate: insert.accuracyRate,
    avgErrorAbs: insert.avgErrorAbs,
    avgResponseTimeMs: insert.avgResponseTimeMs,
    configSnapshot: insert.configSnapshot,
    scoreFormulaVersion: insert.scoreFormulaVersion,
    createdAt,
  };
}

function buildQuestionResultInsertRows(
  inserts: QuestionResultInsertShape[],
  createdAt: string,
): PersistedQuestionResultInsert[] {
  return inserts.map((insert) => ({
    trainingSessionId: insert.trainingSessionId,
    userId: insert.userId,
    questionIndex: insert.questionIndex,
    presentedAt: insert.presentedAt,
    answeredAt: insert.answeredAt,
    mode: insert.mode,
    baseNoteName: insert.baseNoteName,
    baseMidi: insert.baseMidi,
    targetNoteName: insert.targetNoteName,
    targetMidi: insert.targetMidi,
    answerNoteName: insert.answerNoteName,
    answerMidi: insert.answerMidi,
    targetIntervalSemitones: insert.targetIntervalSemitones,
    answerIntervalSemitones: insert.answerIntervalSemitones,
    direction: insert.direction,
    isCorrect: insert.isCorrect,
    errorSemitones: insert.errorSemitones,
    responseTimeMs: insert.responseTimeMs,
    replayBaseCount: insert.replayBaseCount,
    replayTargetCount: insert.replayTargetCount,
    score: insert.score,
    scoreFormulaVersion: insert.scoreFormulaVersion,
    createdAt,
  }));
}

function isSessionFinishReason(value: string): value is SessionFinishReason {
  return SESSION_FINISH_REASONS.includes(value as SessionFinishReason);
}

function isSessionEndConditionType(
  value: string,
): value is SessionEndConditionType {
  return SESSION_END_CONDITION_TYPES.includes(value as SessionEndConditionType);
}
