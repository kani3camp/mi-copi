export type TrainingMode = "distance" | "keyboard";

export type SessionPhase =
  | "config"
  | "preparing"
  | "playing"
  | "answering"
  | "feedback"
  | "result";

export type SessionEndConditionType = "question_count" | "time_limit";

export type SessionFinishReason = "target_reached" | "time_up" | "manual_end";

export type BaseNoteMode = "fixed" | "random";

export type DirectionMode = "up_only" | "mixed";

export type QuestionDirection = "up" | "down";

// MVP canonical note naming uses sharps only.
export type NotationStyle = "sharp";
export type IntervalNotationStyle = "ja" | "abbr" | "mixed";

export type IntervalGranularity = "simple" | "aug_dim";

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

export type ScoreFormulaVersion = "v1";

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
  // This limit applies to the whole session, not each question.
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

export type TrainingConfigSnapshot = TrainingConfig;

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

export interface SessionState {
  phase: SessionPhase;
  config: TrainingConfig;
  startedAt: string | null;
  finishReason: SessionFinishReason | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  results: EvaluatedQuestionResult[];
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

export interface SessionSummary extends SessionSummaryMetrics {
  finishReason: SessionFinishReason;
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

export interface SaveTrainingSessionInput {
  config: TrainingConfigSnapshot;
  finishReason: SessionFinishReason;
  endCondition: TrainingEndCondition;
  startedAt: string;
  endedAt: string;
  summary: SaveTrainingSessionSummaryInput;
  results: SaveQuestionResultInput[];
}

export interface UserSettings {
  global: {
    masterVolume: number;
    soundEffectsEnabled: boolean;
    intervalNotationStyle: IntervalNotationStyle;
    keyboardNoteLabelsVisible: boolean;
  };
  lastDistanceConfig: DistanceTrainingConfig;
  lastKeyboardConfig: KeyboardTrainingConfig;
}

export interface PersistedUserSettings extends UserSettings {
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedTrainingSessionSummary extends SessionSummaryMetrics {
  id: string;
  userId: string;
  mode: TrainingMode;
  startedAt: string;
  endedAt: string;
  createdAt: string;
  finishReason: SessionFinishReason;
  endConditionType: SessionEndConditionType;
  plannedTimeLimitSeconds: number | null;
  scoreFormulaVersion: ScoreFormulaVersion;
  configSnapshot: TrainingConfigSnapshot;
}

export interface PersistedQuestionResult {
  id: string;
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
  createdAt: string;
}

export interface StatsOverview {
  sessionsCount: number;
  answeredQuestionsCount: number;
  averageScore: number;
  averagePitchErrorCents: number;
  averageResponseTimeMs: number;
  bestScore: number;
}

// `referencePitchHz` is fixed at 440 in the MVP and intentionally omitted here.
