import {
  type NewQuestionResultRow,
  type NewTrainingSessionRow,
  questionResults,
  trainingSessions,
} from "../../../lib/db/schema/app";
import type {
  PersistedQuestionResultInsert,
  PersistedTrainingSessionInsert,
  SaveTrainingSessionDb,
  SaveTrainingSessionTx,
} from "./saveTrainingSession";

export interface SaveTrainingSessionDrizzleTx {
  insert(table: typeof trainingSessions): {
    values(values: NewTrainingSessionRow): PromiseLike<unknown> | unknown;
  };
  insert(table: typeof questionResults): {
    values(values: NewQuestionResultRow[]): PromiseLike<unknown> | unknown;
  };
}

export interface SaveTrainingSessionDrizzleDb {
  transaction<T>(
    callback: (tx: SaveTrainingSessionDrizzleTx) => Promise<T>,
  ): Promise<T>;
}

export function createSaveTrainingSessionDb(
  db: SaveTrainingSessionDrizzleDb,
): SaveTrainingSessionDb {
  return {
    transaction<T>(callback: (tx: SaveTrainingSessionTx) => Promise<T>) {
      return db.transaction((tx) => callback(createSaveTrainingSessionTx(tx)));
    },
  };
}

function createSaveTrainingSessionTx(
  tx: SaveTrainingSessionDrizzleTx,
): SaveTrainingSessionTx {
  return {
    async insertTrainingSession(values) {
      await tx.insert(trainingSessions).values(toNewTrainingSessionRow(values));
    },
    async insertQuestionResults(values) {
      await tx.insert(questionResults).values(toNewQuestionResultRows(values));
    },
  };
}

function toNewTrainingSessionRow(
  values: PersistedTrainingSessionInsert,
): NewTrainingSessionRow {
  return {
    ...values,
    sessionScore: toNumericString(values.sessionScore),
    avgScorePerQuestion: toNumericString(values.avgScorePerQuestion),
    accuracyRate: toNumericString(values.accuracyRate),
    avgErrorAbs: toNumericString(values.avgErrorAbs),
    avgResponseTimeMs: toNumericString(values.avgResponseTimeMs),
    startedAt: new Date(values.startedAt),
    endedAt: new Date(values.endedAt),
    createdAt: new Date(values.createdAt),
  };
}

function toNewQuestionResultRows(
  values: PersistedQuestionResultInsert[],
): NewQuestionResultRow[] {
  return values.map((value) => ({
    ...value,
    targetIntervalSemitones: toNumericString(value.targetIntervalSemitones),
    answerIntervalSemitones: toNumericString(value.answerIntervalSemitones),
    errorSemitones: toNumericString(value.errorSemitones),
    score: toNumericString(value.score),
    presentedAt: new Date(value.presentedAt),
    answeredAt: new Date(value.answeredAt),
    createdAt: new Date(value.createdAt),
  }));
}

function toNumericString(value: number): string {
  return value.toString();
}
