import type { CSSProperties } from "react";

import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  formatQuestionDirectionLabel,
  formatSignedSemitoneLabel,
} from "../../../features/training/model/interval-notation";
import type {
  KeyboardGuestResult,
  KeyboardGuestSummary,
} from "../../../features/training/model/keyboard-guest";
import type {
  NoteClass,
  QuestionDirection,
  SessionFinishReason,
} from "../../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  Button,
  KeyValueCard,
  KeyValueGrid,
  Notice,
  SectionHeader,
  Surface,
} from "../../ui/primitives";
import {
  formatFinishReasonLabel,
  getPlaybackStatusLabel,
  PlaybackIcon,
  type TrainingPlaybackKind,
  TrainingResultPersistenceSection,
} from "../train-ui-shared";

const WHITE_KEY_NOTES: NoteClass[] = ["C", "D", "E", "F", "G", "A", "B"];

const BLACK_KEY_LAYOUT: Array<{
  note: NoteClass;
  left: string;
}> = [
  { note: "C#", left: "calc(14.2857% - 5.4%)" },
  { note: "D#", left: "calc(28.5714% - 5.4%)" },
  { note: "F#", left: "calc(57.1428% - 5.4%)" },
  { note: "G#", left: "calc(71.4285% - 5.4%)" },
  { note: "A#", left: "calc(85.7142% - 5.4%)" },
];

export function KeyboardQuestionPanel(props: {
  phase: "playing" | "answering";
  questionIndex: number;
  direction: QuestionDirection;
  replayBaseCount: number;
  replayTargetCount: number;
  playbackKind: TrainingPlaybackKind;
  answerChoices: NoteClass[];
  referenceNote: NoteClass;
  showLabels: boolean;
  onReplayBase: () => void;
  onReplayTarget: () => void;
  onAnswer: (note: NoteClass) => void;
}) {
  return (
    <Surface tone="accent">
      <SectionHeader
        title={`問題 ${props.questionIndex + 1}`}
        description="基準音と問題音を聞いて、鍵盤上の音名で回答してください。"
      />
      <div className="ui-train-status-grid">
        <KeyValueCard
          label="方向"
          value={formatQuestionDirectionLabel(props.direction)}
        />
        <KeyValueCard label="基準音の再生回数" value={props.replayBaseCount} />
        <KeyValueCard
          label="問題音の再生回数"
          value={props.replayTargetCount}
        />
      </div>

      {props.phase === "playing" ? (
        <Notice>{getPlaybackStatusLabel(props.playbackKind)}</Notice>
      ) : null}

      {props.phase === "answering" ? (
        <div className="ui-stack-md">
          <div className="ui-sticky-actions">
            <div className="ui-replay-panel">
              <div className="ui-stack-sm">
                <strong>もう一度聞く</strong>
                <span className="ui-muted">再生中の追加タップは無効です。</span>
              </div>
              <div className="ui-replay-panel__row">
                <Button
                  type="button"
                  onClick={props.onReplayBase}
                  className="ui-icon-button"
                  aria-label="基準音をもう一度聞く"
                >
                  <PlaybackIcon />
                  <span className="ui-icon-button__label">基準音</span>
                </Button>
                <Button
                  type="button"
                  onClick={props.onReplayTarget}
                  className="ui-icon-button"
                  aria-label="問題音をもう一度聞く"
                >
                  <PlaybackIcon />
                  <span className="ui-icon-button__label">問題音</span>
                </Button>
              </div>
            </div>
          </div>
          <KeyboardAnswerPad
            answerChoices={props.answerChoices}
            referenceNote={props.referenceNote}
            onAnswer={props.onAnswer}
            showLabels={props.showLabels}
          />
        </div>
      ) : null}
    </Surface>
  );
}

export function KeyboardFeedbackPanel(props: {
  feedbackResult: KeyboardGuestResult;
  lastAnsweredWasFinal: boolean;
  showLabels: boolean;
  onReplayCorrectTarget: () => void;
  onContinue: () => void;
}) {
  return (
    <Surface>
      <SectionHeader title="フィードバック" />
      <Notice tone={props.feedbackResult.isCorrect ? "success" : "error"}>
        {props.feedbackResult.isCorrect ? "正解" : "不正解"}
      </Notice>
      <KeyValueGrid>
        <KeyValueCard
          label="正解の音"
          value={formatKeyboardNoteLabel(
            props.feedbackResult.question.targetNote,
          )}
        />
        <KeyValueCard
          label="あなたの回答"
          value={formatKeyboardNoteLabel(props.feedbackResult.answeredNote)}
        />
        <KeyValueCard
          label="誤差"
          value={formatSignedSemitoneLabel(props.feedbackResult.errorSemitones)}
        />
        <KeyValueCard
          label="回答時間"
          value={formatResponseTimeMsLabel(props.feedbackResult.responseTimeMs)}
        />
        <KeyValueCard
          label="スコア"
          value={formatScoreLabel(props.feedbackResult.score)}
        />
      </KeyValueGrid>
      <FeedbackKeyboardView
        answeredNote={props.feedbackResult.answeredNote}
        correctNote={props.feedbackResult.question.targetNote}
        isCorrect={props.feedbackResult.isCorrect}
        showLabels={props.showLabels}
      />
      <div className="ui-sticky-actions">
        <Button type="button" onClick={props.onReplayCorrectTarget} block>
          正解の音をもう一度聞く
        </Button>
        <Button
          type="button"
          onClick={props.onContinue}
          variant="primary"
          block
        >
          {props.lastAnsweredWasFinal ? "結果を見る" : "次の問題へ"}
        </Button>
      </div>
    </Surface>
  );
}

export function KeyboardResultPanel(props: {
  summary: KeyboardGuestSummary;
  finishReason: SessionFinishReason | null;
  isAuthenticated: boolean;
  canSaveResult: boolean;
  cannotSaveBecauseNoAnswers: boolean;
  isSavePending: boolean;
  saveResult: SaveTrainingSessionResult | null;
  onRetrySave: () => void;
  onReset: () => void;
}) {
  return (
    <Surface>
      <SectionHeader
        title="結果"
        description="今回のセッションの精度と反応速度をまとめています。"
      />
      <KeyValueGrid>
        <KeyValueCard label="回答数" value={props.summary.questionCount} />
        <KeyValueCard
          label="終了理由"
          value={formatFinishReasonLabel(props.finishReason)}
        />
        <KeyValueCard label="正解数" value={props.summary.correctCount} />
        <KeyValueCard
          label="正答率"
          value={formatAccuracyLabel(props.summary.accuracyRate)}
        />
        <KeyValueCard
          label="平均誤差"
          value={formatAvgErrorLabel(props.summary.avgErrorAbs)}
        />
        <KeyValueCard
          label="平均回答時間"
          value={formatResponseTimeMsLabel(props.summary.avgResponseTimeMs)}
        />
        <KeyValueCard
          label="セッションスコア"
          value={formatScoreLabel(props.summary.sessionScore)}
        />
      </KeyValueGrid>

      {props.finishReason === "time_up" ? (
        <Notice>
          制限時間に達したため終了しました。進行中で未回答の問題は集計から除外されています。
        </Notice>
      ) : null}

      <TrainingResultPersistenceSection
        isAuthenticated={props.isAuthenticated}
        cannotSaveBecauseNoAnswers={props.cannotSaveBecauseNoAnswers}
        canSaveResult={props.canSaveResult}
        isSavePending={props.isSavePending}
        saveResult={props.saveResult}
        onRetrySave={props.onRetrySave}
      />

      {props.cannotSaveBecauseNoAnswers ? (
        <Notice>
          回答済みの問題がないため、このセッションは保存できません。時間に余裕を持ってもう一度お試しください。
        </Notice>
      ) : null}

      <div className="ui-sticky-actions">
        <div className="ui-stack-sm">
          <strong>次に進む</strong>
          <span className="ui-muted">
            結果を確認したら新しいセッションを始められます。
          </span>
        </div>
        <Button type="button" onClick={props.onReset} block>
          {props.cannotSaveBecauseNoAnswers
            ? "新しいセッションを始める"
            : "最初からやり直す"}
        </Button>
      </div>
    </Surface>
  );
}

export function KeyboardAnswerPad(props: {
  answerChoices: NoteClass[];
  referenceNote: NoteClass;
  onAnswer: (note: NoteClass) => void;
  showLabels: boolean;
}) {
  const enabledNotes = new Set(props.answerChoices);

  return (
    <div style={pianoSectionStyle}>
      <div style={pianoShellStyle}>
        <div style={whiteKeyRowStyle}>
          {WHITE_KEY_NOTES.map((note) => (
            <button
              key={note}
              type="button"
              aria-label={formatKeyboardNoteLabel(note)}
              disabled={!enabledNotes.has(note)}
              onClick={() => props.onAnswer(note)}
              style={getKeyboardKeyStyle(note, {
                disabled: !enabledNotes.has(note),
                highlight: note === props.referenceNote ? "reference" : "idle",
                interactive: true,
              })}
            >
              {props.showLabels ? <KeyLabel note={note} /> : null}
            </button>
          ))}
        </div>
        {BLACK_KEY_LAYOUT.map(({ left, note }) => (
          <button
            key={note}
            type="button"
            aria-label={formatKeyboardNoteLabel(note)}
            disabled={!enabledNotes.has(note)}
            onClick={() => props.onAnswer(note)}
            style={getKeyboardKeyStyle(note, {
              disabled: !enabledNotes.has(note),
              highlight: note === props.referenceNote ? "reference" : "idle",
              interactive: true,
              left,
              position: "absolute",
            })}
          >
            {props.showLabels ? <KeyLabel note={note} compact /> : null}
          </button>
        ))}
      </div>
      <div style={feedbackLegendStyle}>
        <span style={legendItemStyle("#2f5f3f", "#e7f1ea")}>基準音の位置</span>
      </div>
    </div>
  );
}

export function FeedbackKeyboardView(props: {
  answeredNote: NoteClass;
  correctNote: NoteClass;
  isCorrect: boolean;
  showLabels: boolean;
}) {
  return (
    <div style={pianoSectionStyle}>
      <div style={pianoShellStyle}>
        <div style={whiteKeyRowStyle}>
          {WHITE_KEY_NOTES.map((note) => (
            <div
              key={note}
              aria-hidden="true"
              style={getKeyboardKeyStyle(note, {
                interactive: false,
                highlight: getKeyboardHighlightTone(
                  note,
                  props.correctNote,
                  props.answeredNote,
                ),
              })}
            >
              {props.showLabels ? <KeyLabel note={note} /> : null}
            </div>
          ))}
        </div>
        {BLACK_KEY_LAYOUT.map(({ left, note }) => (
          <div
            key={note}
            aria-hidden="true"
            style={getKeyboardKeyStyle(note, {
              interactive: false,
              left,
              position: "absolute",
              highlight: getKeyboardHighlightTone(
                note,
                props.correctNote,
                props.answeredNote,
              ),
            })}
          >
            {props.showLabels ? <KeyLabel note={note} compact /> : null}
          </div>
        ))}
      </div>
      <div style={feedbackLegendStyle}>
        <span style={legendItemStyle("#166534", "#dcfce7")}>正解の鍵盤</span>
        {props.isCorrect ? null : (
          <span style={legendItemStyle("#9a3412", "#ffedd5")}>
            あなたの回答
          </span>
        )}
      </div>
    </div>
  );
}

export function formatKeyboardNoteLabel(note: NoteClass): string {
  switch (note) {
    case "C#":
      return "C# / Db";
    case "D#":
      return "D# / Eb";
    case "F#":
      return "F# / Gb";
    case "G#":
      return "G# / Ab";
    case "A#":
      return "A# / Bb";
    default:
      return note;
  }
}

function getKeyboardKeyStyle(
  note: NoteClass,
  options: {
    disabled?: boolean;
    highlight?: "idle" | "reference" | "correct" | "answered" | "both";
    interactive: boolean;
    left?: string;
    position?: "relative" | "absolute";
  },
): CSSProperties {
  const blackKey = isBlackKey(note);
  const highlight = options.highlight ?? "idle";
  const isReference = highlight === "reference";
  const isCorrect = highlight === "correct" || highlight === "both";
  const isAnswered = highlight === "answered";
  const background = blackKey
    ? isReference
      ? "linear-gradient(180deg, #6aa57a 0%, #2f5f3f 100%)"
      : isCorrect
        ? "linear-gradient(180deg, #34d399 0%, #065f46 100%)"
        : isAnswered
          ? "linear-gradient(180deg, #fb923c 0%, #9a3412 100%)"
          : "linear-gradient(180deg, #374151 0%, #111827 100%)"
    : isReference
      ? "linear-gradient(180deg, #ffffff 0%, #e7f1ea 100%)"
      : isCorrect
        ? "linear-gradient(180deg, #ffffff 0%, #dcfce7 100%)"
        : isAnswered
          ? "linear-gradient(180deg, #ffffff 0%, #ffedd5 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)";
  const border = blackKey
    ? isReference
      ? "2px solid #7db08b"
      : isCorrect
        ? "2px solid #34d399"
        : isAnswered
          ? "2px solid #fdba74"
          : "1px solid #111827"
    : isReference
      ? "2px solid var(--color-primary)"
      : isCorrect
        ? "2px solid #16a34a"
        : isAnswered
          ? "2px solid #f97316"
          : "1px solid #d1d5db";

  return {
    position: options.position ?? "relative",
    left: options.left,
    top: options.position === "absolute" ? 0 : undefined,
    width: blackKey ? "10.8%" : undefined,
    minHeight: blackKey
      ? "clamp(110px, 24vw, 148px)"
      : "clamp(176px, 42vw, 240px)",
    padding: blackKey ? "14px 4px 10px" : "18px 6px 14px",
    borderRadius: blackKey ? "0 0 14px 14px" : "0 0 18px 18px",
    border,
    background,
    color: blackKey ? "#f9fafb" : "#111827",
    fontWeight: 700,
    fontSize: blackKey ? "11px" : "13px",
    lineHeight: 1.1,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    textAlign: "center",
    cursor: options.interactive && !options.disabled ? "pointer" : "default",
    opacity: options.disabled ? 0.5 : 1,
    boxShadow: blackKey
      ? isReference
        ? "0 12px 24px rgba(78, 143, 99, 0.26)"
        : isCorrect
          ? "0 12px 24px rgba(5, 150, 105, 0.34)"
          : isAnswered
            ? "0 12px 24px rgba(234, 88, 12, 0.3)"
            : "0 10px 20px rgba(17, 24, 39, 0.28)"
      : isReference
        ? "0 10px 24px rgba(78, 143, 99, 0.16)"
        : isCorrect
          ? "0 10px 24px rgba(34, 197, 94, 0.18)"
          : isAnswered
            ? "0 10px 24px rgba(249, 115, 22, 0.18)"
            : "0 8px 18px rgba(15, 23, 42, 0.08)",
    transform:
      options.interactive && !options.disabled ? "translateY(0)" : undefined,
    touchAction: "manipulation",
    zIndex: blackKey ? 2 : 1,
  };
}

function KeyLabel(props: { note: NoteClass; compact?: boolean }) {
  if (isBlackKey(props.note)) {
    const [sharp, flat] = formatKeyboardNoteLabel(props.note).split(" / ");

    return (
      <span
        style={{
          display: "grid",
          gap: "2px",
          justifyItems: "center",
          fontSize: props.compact ? "10px" : "11px",
        }}
      >
        <span>{sharp}</span>
        <span style={{ opacity: 0.82 }}>{flat}</span>
      </span>
    );
  }

  return <span>{props.note}</span>;
}

function getKeyboardHighlightTone(
  note: NoteClass,
  correctNote: NoteClass,
  answeredNote: NoteClass,
): "idle" | "correct" | "answered" | "both" {
  if (note === correctNote && note === answeredNote) {
    return "both";
  }

  if (note === correctNote) {
    return "correct";
  }

  if (note === answeredNote) {
    return "answered";
  }

  return "idle";
}

function isBlackKey(note: NoteClass): boolean {
  return (
    note === "C#" ||
    note === "D#" ||
    note === "F#" ||
    note === "G#" ||
    note === "A#"
  );
}

const pianoSectionStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const pianoShellStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  padding: "12px 10px 16px",
  borderRadius: "22px",
  border: "1px solid #d6ccbb",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(245,241,232,0.96) 100%)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.9), 0 16px 32px rgba(15, 23, 42, 0.08)",
};

const whiteKeyRowStyle: CSSProperties = {
  display: "grid",
  gap: "0",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
};

const feedbackLegendStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

function legendItemStyle(color: string, background: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "999px",
    background,
    color,
    fontSize: "12px",
    fontWeight: 700,
  };
}
