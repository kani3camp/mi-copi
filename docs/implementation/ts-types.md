# TypeScript Types

This document defines the main TypeScript shapes that implementation should align with.

## Core Unions

```ts
export type SessionPhase =
  | "config"
  | "preparing"
  | "playing"
  | "answering"
  | "feedback"
  | "result";

export type TrainingMode = "distance" | "keyboard";
export type DirectionMode = "up_only" | "mixed";
export type BaseNoteMode = "fixed" | "random";
export type SessionEndConditionType = "question_count" | "time_limit";
export type SessionFinishReason =
  | "target_reached"
  | "time_up"
  | "manual_end";
export type QuestionDirection = "up" | "down";
export type NotationStyle = "sharp";
export type NoteClass =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";
export type IntervalGranularity = "simple" | "aug_dim";

export type ScoreFormulaVersion = "v1";
```

## Training Config

```ts
export interface IntervalRange {
  minSemitones: number;
  maxSemitones: number;
}

export interface TrainingEndConditionByQuestionCount {
  type: "question_count";
  questionCount: number;
}

export interface TrainingEndConditionByTimeLimit {
  type: "time_limit";
  timeLimitMinutes: number;
}

export type TrainingEndCondition =
  | TrainingEndConditionByQuestionCount
  | TrainingEndConditionByTimeLimit;

export interface TrainingConfigBase {
  mode: TrainingMode;
  intervalRange: IntervalRange;
  directionMode: DirectionMode;
  includeUnison: boolean;
  includeOctave: boolean;
  baseNoteMode: BaseNoteMode;
  fixedBaseNote: NoteClass | null;
  endCondition: TrainingEndCondition;
}

export interface DistanceTrainingConfig extends TrainingConfigBase {
  mode: "distance";
  intervalGranularity: IntervalGranularity;
}

export interface KeyboardTrainingConfig extends TrainingConfigBase {
  mode: "keyboard";
}

export type TrainingConfig = DistanceTrainingConfig | KeyboardTrainingConfig;
```

## Question And Answer

```ts
export interface Question {
  questionIndex: number;
  direction: QuestionDirection;
  baseNote: NoteClass;
  targetNote: NoteClass;
  distanceSemitones: number;
  notationStyle: NotationStyle;
}

export interface AnswerSubmission {
  questionIndex: number;
  mode: TrainingMode;
  answeredDistanceSemitones: number | null;
  answeredNote: NoteClass | null;
}
```

## Question Result

```ts
export interface EvaluatedQuestionResult {
  questionIndex: number;
  question: Question;
  answer: AnswerSubmission;
  pitchErrorCents: number;
  responseTimeMs: number;
  replayCount: number;
  distanceSemitones: number;
  score: number;
  scoreFormulaVersion: ScoreFormulaVersion;
}
```

## Persistence Types

```ts
export interface SaveQuestionResultInput {
  questionIndex: number;
  presentedAt: string;
  answeredAt: string;
  mode: TrainingMode;
  baseNoteName: NoteClass;
  baseMidi: number;
  targetNoteName: NoteClass;
  targetMidi: number;
  answerNoteName: NoteClass;
  answerMidi: number;
  targetIntervalSemitones: number;
  answerIntervalSemitones: number;
  direction: QuestionDirection;
  isCorrect: boolean;
  errorSemitones: number;
  responseTimeMs: number;
  replayBaseCount: number;
  replayTargetCount: number;
  score: number;
  scoreFormulaVersion: ScoreFormulaVersion;
}

export interface SessionSummaryMetrics {
  plannedQuestionCount?: number;
  answeredQuestionCount: number;
  correctQuestionCount: number;
  sessionScore: number;
  avgScorePerQuestion: number;
  accuracyRate: number;
  avgErrorAbs: number;
  avgResponseTimeMs: number;
}

export type SaveTrainingSessionSummaryInput = SessionSummaryMetrics;

export interface PlannedSessionInsertFields {
  endConditionType: SessionEndConditionType;
  plannedQuestionCount: number | null;
  plannedTimeLimitSeconds: number | null;
}

export interface TrainingSessionInsertShape extends PlannedSessionInsertFields {
  userId: string;
  mode: TrainingMode;
  startedAt: string;
  endedAt: string;
  finishReason: SessionFinishReason;
  answeredQuestionCount: number;
  correctQuestionCount: number;
  sessionScore: number;
  avgScorePerQuestion: number;
  accuracyRate: number;
  avgErrorAbs: number;
  avgResponseTimeMs: number;
  configSnapshot: TrainingConfig;
  scoreFormulaVersion: ScoreFormulaVersion;
}

export interface QuestionResultInsertShape {
  sessionId: string;
  userId: string;
  questionIndex: number;
  presentedAt: string;
  answeredAt: string;
  mode: TrainingMode;
  baseNoteName: NoteClass;
  baseMidi: number;
  targetNoteName: NoteClass;
  targetMidi: number;
  answerNoteName: NoteClass;
  answerMidi: number;
  targetIntervalSemitones: number;
  answerIntervalSemitones: number;
  direction: QuestionDirection;
  isCorrect: boolean;
  errorSemitones: number;
  responseTimeMs: number;
  replayBaseCount: number;
  replayTargetCount: number;
  score: number;
  scoreFormulaVersion: ScoreFormulaVersion;
}

export interface SessionSummary extends SessionSummaryMetrics {
  finishReason: SessionFinishReason;
}

export interface SaveTrainingSessionInput {
  config: TrainingConfig;
  finishReason: SessionFinishReason;
  endCondition: TrainingEndCondition;
  startedAt: string;
  endedAt: string;
  summary: SaveTrainingSessionSummaryInput;
  results: SaveQuestionResultInput[];
}
```

## Session State

```ts
export interface SessionState {
  phase: SessionPhase;
  config: TrainingConfig;
  startedAt: string | null;
  finishReason: SessionFinishReason | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  results: EvaluatedQuestionResult[];
}
```

## Settings And Summary

```ts
export interface UserSettings {
  lastDistanceConfig: DistanceTrainingConfig;
  lastKeyboardConfig: KeyboardTrainingConfig;
}

export interface StatsOverview {
  sessionsCount: number;
  answeredQuestionsCount: number;
  averageScore: number;
  averagePitchErrorCents: number;
  averageResponseTimeMs: number;
  bestScore: number;
}
```

## Trends

```ts
export interface RecentQuestionTrend {
  trainingSessionId: string;
  questionIndex: number;
  score: number;
  pitchErrorCents: number;
  responseTimeMs: number;
  createdAt: string;
}

export interface DailyTrendPoint {
  date: string;
  sessionsCount: number;
  answeredQuestionsCount: number;
  averageScore: number;
}
```

## Notes

- Score values are `number` in TypeScript and are persisted rounded to three fractional digits.
- UI display may round score values to whole numbers, but implementation must preserve decimals internally.
- `SaveTrainingSessionInput.results` contains only answered questions that survived timeout handling.
- `SaveTrainingSessionInput` is used only for authenticated end-of-session saves.
- `SaveTrainingSessionInput.summary` carries the persisted session-level aggregates used by result/home/stats views.
- `SessionSummaryMetrics` maps directly to the summary columns stored in `training_sessions`.
- `SaveTrainingSessionInput.finishReason` maps to `training_sessions.finish_reason`.
- `SaveTrainingSessionInput.endCondition` maps to `training_sessions.end_condition_type` plus `planned_question_count` or `planned_time_limit_seconds`.
- `planned_time_limit_seconds` is derived from `endCondition.timeLimitMinutes * 60` at persistence time.
- Persistence mappers convert `SaveTrainingSessionInput` into `TrainingSessionInsertShape` and `QuestionResultInsertShape[]` before DB insert.
- Guest sessions keep the same in-memory result shape but do not submit this contract to the server.
- `referencePitchHz` is fixed at `440` in the MVP and is not part of `TrainingConfig`.
- `fixedBaseNote` uses note class values and is only active when `baseNoteMode = "fixed"`.
- `endCondition.timeLimitMinutes` is a session-wide limit and is not interpreted per question.
- `intervalGranularity` exists only for `distance` mode.
- `intervalGranularity = "simple"` means minor / major / perfect only.
- `intervalGranularity = "aug_dim"` adds augmented fourth and diminished fifth.
- `keyboard` mode has no additional MVP-only config fields.
- Domain evaluation types and persistence DTOs are intentionally separated.
