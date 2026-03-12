# TypeScript Types

Canonical source:
- This document defines the implementation-facing TypeScript shapes derived from the product docs.
- Product policy is set by `docs/product/requirements.md`, `docs/product/basic-design.md`, and `docs/product/ui-system.md`.
- DB-facing field names must stay aligned with `docs/implementation/db-schema.md` and `docs/implementation/api-contracts.md`.

Related docs:
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/implementation/api-contracts.md`
- `docs/implementation/db-schema.md`
- `docs/implementation/training-flow.md`
- `docs/implementation/scoring.md`

This document decides:
- canonical union names used in training, persistence, and stats
- runtime state shapes for the train route
- end-of-session save payload and DB insert shapes

This document does not decide:
- visual component props
- exact reducer implementation details
- future non-MVP expansion types

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
export type QuestionDirection = "up" | "down";
export type BaseNoteMode = "fixed" | "random";
export type SessionEndConditionType = "question_count" | "time_limit";
export type SessionFinishReason =
  | "target_reached"
  | "time_up"
  | "manual_end";
export type IntervalNotationStyle = "ja" | "abbr" | "mixed";
export type IntervalGranularity = "simple" | "aug_dim";
export type ScoreFormulaVersion = "v1";

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
```

## Training Config

```ts
export interface IntervalRange {
  minSemitone: number;
  maxSemitone: number;
}

export interface QuestionCountEndCondition {
  type: "question_count";
  questionCount: number;
}

export interface TimeLimitEndCondition {
  type: "time_limit";
  timeLimitSeconds: number;
}

export type TrainingEndCondition =
  | QuestionCountEndCondition
  | TimeLimitEndCondition;

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
export type TrainingConfigSnapshot = TrainingConfig;
```

## Training Route State

`SessionPhase` is the canonical internal state for the train route.

```ts
export interface QuestionPrompt {
  questionIndex: number;
  direction: QuestionDirection;
  baseNoteName: NoteClass;
  baseMidi: number;
  targetNoteName: NoteClass;
  targetMidi: number;
  targetIntervalSemitones: number;
  presentedAtMs: number;
}

export interface ActiveQuestionState {
  prompt: QuestionPrompt;
  playbackCompletedAtMs: number | null;
  replayBaseCount: number;
  replayTargetCount: number;
}

export interface SessionState {
  phase: SessionPhase;
  config: TrainingConfig;
  startedAtMs: number | null;
  deadlineAtMs: number | null;
  currentQuestionIndex: number;
  activeQuestion: ActiveQuestionState | null;
  answeredResults: EvaluatedQuestionResult[];
  finishReason: SessionFinishReason | null;
}
```

## Answers And Evaluation

```ts
export interface DistanceAnswerSubmission {
  mode: "distance";
  questionIndex: number;
  answerIntervalSemitones: number;
}

export interface KeyboardAnswerSubmission {
  mode: "keyboard";
  questionIndex: number;
  answerNoteName: NoteClass;
  answerMidi: number;
}

export type AnswerSubmission =
  | DistanceAnswerSubmission
  | KeyboardAnswerSubmission;

export interface EvaluatedQuestionResult {
  questionIndex: number;
  presentedAtMs: number;
  answeredAtMs: number;
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
```

`EvaluatedQuestionResult.errorSemitones` is the canonical signed error field.
Do not use legacy cent-based error field names in MVP docs or code.

## Save Payload

`SaveTrainingSessionInput` is used only for authenticated end-of-session saves.
Guest sessions keep the same in-memory result shape, but they never submit this payload.

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

export interface SaveTrainingSessionInput {
  config: TrainingConfigSnapshot;
  finishReason: SessionFinishReason;
  endCondition: TrainingEndCondition;
  startedAt: string;
  endedAt: string;
  summary: SaveTrainingSessionSummaryInput;
  results: SaveQuestionResultInput[];
}
```

## Persistence Shapes

These shapes align with the explicit DB column names in `docs/implementation/db-schema.md`.

```ts
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
  configSnapshot: TrainingConfigSnapshot;
  scoreFormulaVersion: ScoreFormulaVersion;
}

export interface QuestionResultInsertShape {
  trainingSessionId: string;
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
```

## Settings

```ts
export interface GlobalUserSettings {
  masterVolume: number;
  soundEffectsEnabled: boolean;
  intervalNotationStyle: IntervalNotationStyle;
  keyboardNoteLabelsVisible: boolean;
}

export interface UserSettings {
  global: GlobalUserSettings;
  lastDistanceConfig: DistanceTrainingConfig;
  lastKeyboardConfig: KeyboardTrainingConfig;
}
```

## Stats Read Models

```ts
export interface PerformanceSummary {
  questionCount: number;
  correctRate: number;
  averageScore: number;
  averageErrorAbs: number;
  averageResponseTimeMs: number;
}

export interface IntervalPerformanceSummary extends PerformanceSummary {
  targetIntervalSemitones: number;
}

export interface ModeStatsOverview {
  sessionCount: number;
  answeredQuestionCount: number;
  cumulativeScore: number;
  correctRate: number;
  averageErrorAbs: number;
  medianErrorAbs: number;
  averageResponseTimeMs: number;
}

export interface ErrorBiasSummary {
  higherRate: number;
  lowerRate: number;
  onTargetRate: number;
}

export interface RecentQuestionSummary {
  questionCount: number;
  correctRate: number;
  averageScore: number;
  averageErrorAbs: number;
  averageResponseTimeMs: number;
}

export interface StatsOverview {
  answeredQuestionCount: number;
  cumulativeScore: number;
  overallCorrectRate: number;
  averageErrorAbs: number;
  medianErrorAbs: number;
  averageResponseTimeMs: number;
  recent10: RecentQuestionSummary;
  recent30: RecentQuestionSummary;
  byInterval: IntervalPerformanceSummary[];
  byDirection: Record<QuestionDirection, PerformanceSummary>;
  errorBias: ErrorBiasSummary;
  byMode: Record<TrainingMode, ModeStatsOverview>;
}

export interface RecentQuestionTrend {
  trainingSessionId: string;
  questionIndex: number;
  mode: TrainingMode;
  score: number;
  errorSemitones: number;
  responseTimeMs: number;
  answeredAt: string;
}

export interface DailyTrendPoint {
  date: string;
  answeredQuestionCount: number;
  correctRate: number;
  averageScore: number;
  averageErrorAbs: number;
  averageResponseTimeMs: number;
}
```

## Notes

- `referencePitchHz = 440` is a fixed runtime value and is not part of `TrainingConfig`.
- `intervalGranularity` exists only for `distance` mode.
- `TrainingConfig.endCondition.timeLimitSeconds` is session-wide, not per-question.
- `SaveTrainingSessionInput.results` contains only answered questions that survived timeout handling.
- `plannedTimeLimitSeconds` is derived directly from `endCondition.timeLimitSeconds`.
- Score values stay decimal in memory and in DB persistence; only display layers round more aggressively.
