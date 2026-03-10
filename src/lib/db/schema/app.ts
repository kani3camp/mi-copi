import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  DistanceTrainingConfig,
  KeyboardTrainingConfig,
  NoteClass,
  QuestionDirection,
  SessionEndConditionType,
  SessionFinishReason,
  TrainingMode,
  TrainingConfigSnapshot,
} from "../../../features/training/model/types";

export const scoreFormulaVersionEnum = pgEnum("score_formula_version", ["v1"]);
export const trainingModeEnum = pgEnum("training_mode", ["distance", "keyboard"]);
export const sessionFinishReasonEnum = pgEnum("session_finish_reason", [
  "target_reached",
  "time_up",
  "manual_end",
]);
export const sessionEndConditionTypeEnum = pgEnum("session_end_condition_type", [
  "question_count",
  "time_limit",
]);

// TODO: Replace this placeholder with the actual Better Auth `user.id` type and
// foreign-key reference once the auth schema is added to the repository.
const authUserId = (name: string) => text(name);

export const userSettings = pgTable("user_settings", {
  userId: authUserId("user_id").primaryKey().notNull(),
  lastDistanceConfig: jsonb("last_distance_config")
    .$type<DistanceTrainingConfig>()
    .notNull(),
  lastKeyboardConfig: jsonb("last_keyboard_config")
    .$type<KeyboardTrainingConfig>()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const trainingSessions = pgTable(
  "training_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: authUserId("user_id").notNull(),
    mode: trainingModeEnum("mode")
      .$type<TrainingMode>()
      .notNull(),
    scoreFormulaVersion: scoreFormulaVersionEnum("score_formula_version")
      .default("v1")
      .notNull(),
    finishReason: sessionFinishReasonEnum("finish_reason")
      .$type<SessionFinishReason>()
      .notNull(),
    endConditionType: sessionEndConditionTypeEnum("end_condition_type")
      .$type<SessionEndConditionType>()
      .notNull(),
    configSnapshot: jsonb("config_snapshot")
      .$type<TrainingConfigSnapshot>()
      .notNull(),
    plannedQuestionCount: integer("planned_question_count"),
    plannedTimeLimitSeconds: integer("planned_time_limit_seconds"),
    answeredQuestionCount: integer("answered_question_count").notNull(),
    correctQuestionCount: integer("correct_question_count").notNull(),
    sessionScore: numeric("session_score", { precision: 10, scale: 3 }).notNull(),
    avgScorePerQuestion: numeric("avg_score_per_question", {
      precision: 10,
      scale: 3,
    }).notNull(),
    accuracyRate: numeric("accuracy_rate", { precision: 10, scale: 3 }).notNull(),
    avgErrorAbs: numeric("avg_error_abs", { precision: 10, scale: 3 }).notNull(),
    avgResponseTimeMs: numeric("avg_response_time_ms", {
      precision: 10,
      scale: 3,
    }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdIdx: index("training_sessions_user_id_idx").on(table.userId),
    userIdModeEndedAtIdx: index("training_sessions_user_id_mode_ended_at_idx").on(
      table.userId,
      table.mode,
      table.endedAt,
    ),
    userIdEndedAtIdx: index("training_sessions_user_id_ended_at_idx").on(
      table.userId,
      table.endedAt,
    ),
    plannedQuestionCountCheck: check(
      "training_sessions_planned_question_count_non_negative",
      sql`${table.plannedQuestionCount} is null or ${table.plannedQuestionCount} >= 0`,
    ),
    plannedTimeLimitSecondsCheck: check(
      "training_sessions_planned_time_limit_seconds_positive",
      sql`${table.plannedTimeLimitSeconds} is null or ${table.plannedTimeLimitSeconds} > 0`,
    ),
    answeredQuestionCountCheck: check(
      "training_sessions_answered_question_count_non_negative",
      sql`${table.answeredQuestionCount} >= 0`,
    ),
    correctQuestionCountCheck: check(
      "training_sessions_correct_question_count_non_negative",
      sql`${table.correctQuestionCount} >= 0`,
    ),
    answeredQuestionCountBoundCheck: check(
      "training_sessions_answered_question_count_lte_planned_question_count",
      sql`${table.plannedQuestionCount} is null or ${table.answeredQuestionCount} <= ${table.plannedQuestionCount}`,
    ),
    endConditionQuestionCountCheck: check(
      "training_sessions_question_count_requires_planned_question_count",
      sql`${table.endConditionType} <> 'question_count' or ${table.plannedQuestionCount} is not null`,
    ),
    endConditionTimeLimitCheck: check(
      "training_sessions_time_limit_requires_planned_time_limit_seconds",
      sql`${table.endConditionType} <> 'time_limit' or ${table.plannedTimeLimitSeconds} is not null`,
    ),
    correctQuestionCountBoundCheck: check(
      "training_sessions_correct_question_count_lte_answered_question_count",
      sql`${table.correctQuestionCount} <= ${table.answeredQuestionCount}`,
    ),
    sessionScoreCheck: check(
      "training_sessions_session_score_non_negative",
      sql`${table.sessionScore} >= 0`,
    ),
    avgScorePerQuestionCheck: check(
      "training_sessions_avg_score_per_question_non_negative",
      sql`${table.avgScorePerQuestion} >= 0`,
    ),
    accuracyRateCheck: check(
      "training_sessions_accuracy_rate_between_zero_and_one",
      sql`${table.accuracyRate} >= 0 and ${table.accuracyRate} <= 1`,
    ),
    avgErrorAbsCheck: check(
      "training_sessions_avg_error_abs_non_negative",
      sql`${table.avgErrorAbs} >= 0`,
    ),
    avgResponseTimeMsCheck: check(
      "training_sessions_avg_response_time_ms_non_negative",
      sql`${table.avgResponseTimeMs} >= 0`,
    ),
  }),
);

export const questionResults = pgTable(
  "question_results",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    trainingSessionId: uuid("training_session_id")
      .references(() => trainingSessions.id)
      .notNull(),
    userId: authUserId("user_id").notNull(),
    questionIndex: integer("question_index").notNull(),
    presentedAt: timestamp("presented_at", { withTimezone: true }).notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull(),
    mode: text("mode")
      .$type<TrainingMode>()
      .notNull(),
    baseNoteName: text("base_note_name")
      .$type<NoteClass>()
      .notNull(),
    baseMidi: integer("base_midi").notNull(),
    targetNoteName: text("target_note_name")
      .$type<NoteClass>()
      .notNull(),
    targetMidi: integer("target_midi").notNull(),
    answerNoteName: text("answer_note_name")
      .$type<NoteClass>()
      .notNull(),
    answerMidi: integer("answer_midi").notNull(),
    targetIntervalSemitones: numeric("target_interval_semitones", {
      precision: 10,
      scale: 3,
    }).notNull(),
    answerIntervalSemitones: numeric("answer_interval_semitones", {
      precision: 10,
      scale: 3,
    }).notNull(),
    direction: text("direction")
      .$type<QuestionDirection>()
      .notNull(),
    isCorrect: boolean("is_correct").notNull(),
    errorSemitones: numeric("error_semitones", {
      precision: 10,
      scale: 3,
    }).notNull(),
    responseTimeMs: integer("response_time_ms").notNull(),
    replayBaseCount: integer("replay_base_count").notNull(),
    replayTargetCount: integer("replay_target_count").notNull(),
    score: numeric("score", { precision: 10, scale: 3 }).notNull(),
    scoreFormulaVersion: scoreFormulaVersionEnum("score_formula_version")
      .default("v1")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    trainingSessionIdIdx: index("question_results_training_session_id_idx").on(
      table.trainingSessionId,
    ),
    userIdModeAnsweredAtIdx: index("question_results_user_id_mode_answered_at_idx").on(
      table.userId,
      table.mode,
      table.answeredAt,
    ),
    trainingSessionIdQuestionIndexIdx: index(
      "question_results_training_session_id_question_index_idx",
    ).on(table.trainingSessionId, table.questionIndex),
    trainingSessionIdQuestionIndexUnique: uniqueIndex(
      "question_results_training_session_id_question_index_key",
    ).on(table.trainingSessionId, table.questionIndex),
    questionIndexCheck: check(
      "question_results_question_index_non_negative",
      sql`${table.questionIndex} >= 0`,
    ),
    responseTimeMsCheck: check(
      "question_results_response_time_ms_non_negative",
      sql`${table.responseTimeMs} >= 0`,
    ),
    replayBaseCountCheck: check(
      "question_results_replay_base_count_non_negative",
      sql`${table.replayBaseCount} >= 0`,
    ),
    replayTargetCountCheck: check(
      "question_results_replay_target_count_non_negative",
      sql`${table.replayTargetCount} >= 0`,
    ),
  }),
);

export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettingsRow = typeof userSettings.$inferInsert;

export type TrainingSessionRow = typeof trainingSessions.$inferSelect;
export type NewTrainingSessionRow = typeof trainingSessions.$inferInsert;

export type QuestionResultRow = typeof questionResults.$inferSelect;
export type NewQuestionResultRow = typeof questionResults.$inferInsert;
