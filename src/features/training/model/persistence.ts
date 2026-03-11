import type {
  PlannedSessionInsertFields,
  QuestionResultInsertShape,
  SaveQuestionResultInput,
  SaveTrainingSessionInput,
  ScoreFormulaVersion,
  TrainingEndCondition,
  TrainingSessionInsertShape,
} from "./types";

export function toTrainingSessionInsert(
  input: SaveTrainingSessionInput,
  userId: string,
): TrainingSessionInsertShape {
  const plannedFields = toPlannedSessionFields(input.endCondition);

  return {
    userId,
    mode: input.config.mode,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    finishReason: input.finishReason,
    endConditionType: plannedFields.endConditionType,
    plannedQuestionCount: plannedFields.plannedQuestionCount,
    plannedTimeLimitSeconds: plannedFields.plannedTimeLimitSeconds,
    answeredQuestionCount: input.summary.answeredQuestionCount,
    correctQuestionCount: input.summary.correctQuestionCount,
    sessionScore: input.summary.sessionScore,
    avgScorePerQuestion: input.summary.avgScorePerQuestion,
    accuracyRate: input.summary.accuracyRate,
    avgErrorAbs: input.summary.avgErrorAbs,
    avgResponseTimeMs: input.summary.avgResponseTimeMs,
    configSnapshot: input.config,
    scoreFormulaVersion: getScoreFormulaVersion(input.results),
  };
}

export function toQuestionResultInserts(
  input: SaveTrainingSessionInput,
  sessionId: string,
  userId: string,
): QuestionResultInsertShape[] {
  return input.results.map((result) =>
    toQuestionResultInsert(result, sessionId, userId),
  );
}

export function toPlannedSessionFields(
  endCondition: TrainingEndCondition,
): PlannedSessionInsertFields {
  if (endCondition.type === "time_limit") {
    return {
      endConditionType: "time_limit",
      plannedQuestionCount: null,
      plannedTimeLimitSeconds: endCondition.timeLimitMinutes * 60,
    };
  }

  return {
    endConditionType: "question_count",
    plannedQuestionCount: endCondition.questionCount,
    plannedTimeLimitSeconds: null,
  };
}

export function toQuestionResultInsert(
  result: SaveQuestionResultInput,
  sessionId: string,
  userId: string,
): QuestionResultInsertShape {
  return {
    trainingSessionId: sessionId,
    userId,
    questionIndex: result.questionIndex,
    presentedAt: result.presentedAt,
    answeredAt: result.answeredAt,
    mode: result.mode,
    baseNoteName: result.baseNoteName,
    baseMidi: result.baseMidi,
    targetNoteName: result.targetNoteName,
    targetMidi: result.targetMidi,
    answerNoteName: result.answerNoteName,
    answerMidi: result.answerMidi,
    targetIntervalSemitones: result.targetIntervalSemitones,
    answerIntervalSemitones: result.answerIntervalSemitones,
    direction: result.direction,
    isCorrect: result.isCorrect,
    errorSemitones: result.errorSemitones,
    responseTimeMs: result.responseTimeMs,
    replayBaseCount: result.replayBaseCount,
    replayTargetCount: result.replayTargetCount,
    score: result.score,
    scoreFormulaVersion: result.scoreFormulaVersion,
  };
}

function getScoreFormulaVersion(
  results: SaveQuestionResultInput[],
): ScoreFormulaVersion {
  return results[0]?.scoreFormulaVersion ?? "v1";
}
