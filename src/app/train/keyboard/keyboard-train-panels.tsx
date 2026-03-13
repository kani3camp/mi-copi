import { type CSSProperties, memo } from "react";

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
  Chip,
  KeyValueCard,
  Notice,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
} from "../../ui/primitives";
import {
  formatFinishReasonLabel,
  PlaybackButtonPair,
  type TrainingPlaybackKind,
  TrainingResultPersistenceSection,
} from "../train-ui-shared";
import { formatKeyboardNoteLabel } from "./keyboard-note-label";

const WHITE_KEY_NOTES: NoteClass[] = ["C", "D", "E", "F", "G", "A", "B"];

const BLACK_KEY_LAYOUT: Array<{ note: NoteClass; left: string }> = [
  { note: "C#", left: "calc(14.2857% - 5.4%)" },
  { note: "D#", left: "calc(28.5714% - 5.4%)" },
  { note: "F#", left: "calc(57.1428% - 5.4%)" },
  { note: "G#", left: "calc(71.4285% - 5.4%)" },
  { note: "A#", left: "calc(85.7142% - 5.4%)" },
];

export const KeyboardQuestionPanel = memo(
  function KeyboardQuestionPanel(props: {
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
    const isPlaybackLocked = props.phase === "playing";

    return (
      <Surface tone="accent">
        <SectionHeader
          title="音を聴いて鍵盤で答える"
          description="基準音の位置を見ながら、問題音の鍵盤を選びます。"
          actions={<Chip tone="teal">回答中</Chip>}
        />
        <PlaybackButtonPair
          isPlaybackLocked={isPlaybackLocked}
          playbackKind={props.playbackKind}
          onReplayBase={props.onReplayBase}
          onReplayTarget={props.onReplayTarget}
        />
        <div className="ui-mini-stat-row">
          <KeyValueCard
            className="ui-kv-card--dense"
            label="方向"
            value={formatQuestionDirectionLabel(props.direction)}
          />
          <KeyValueCard
            className="ui-kv-card--dense"
            label="基準音"
            value={`${props.replayBaseCount}回`}
          />
          <KeyValueCard
            className="ui-kv-card--dense"
            label="問題音"
            value={`${props.replayTargetCount}回`}
          />
        </div>
        <KeyboardAnswerPad
          answerChoices={props.answerChoices}
          referenceNote={props.referenceNote}
          onAnswer={props.onAnswer}
          showLabels={props.showLabels}
          disabled={isPlaybackLocked}
        />
      </Surface>
    );
  },
);

export const KeyboardFeedbackPanel = memo(
  function KeyboardFeedbackPanel(props: {
    feedbackResult: KeyboardGuestResult;
    lastAnsweredWasFinal: boolean;
    showLabels: boolean;
    onReplayCorrectTarget: () => void;
    onContinue: () => void;
  }) {
    return (
      <Surface tone="elevated">
        <SectionHeader
          title="フィードバック"
          actions={
            <Chip tone={props.feedbackResult.isCorrect ? "brand" : "teal"}>
              {props.feedbackResult.isCorrect ? "正解" : "確認"}
            </Chip>
          }
        />
        <SummaryBlock>
          <SummaryStat
            label="正解"
            value={formatKeyboardNoteLabel(
              props.feedbackResult.question.targetNote,
            )}
            emphasis="primary"
          />
          <SummaryStat
            label="回答"
            value={formatKeyboardNoteLabel(props.feedbackResult.answeredNote)}
          />
        </SummaryBlock>
        <FeedbackKeyboardView
          answeredNote={props.feedbackResult.answeredNote}
          correctNote={props.feedbackResult.question.targetNote}
          referenceNote={props.feedbackResult.question.baseNote}
          showLabels={props.showLabels}
        />
        <SummaryBlock>
          <SummaryStat
            label="誤差"
            value={formatSignedSemitoneLabel(
              props.feedbackResult.errorSemitones,
            )}
          />
          <SummaryStat
            label="回答時間"
            value={formatResponseTimeMsLabel(
              props.feedbackResult.responseTimeMs,
            )}
          />
          <SummaryStat
            label="スコア"
            value={formatScoreLabel(props.feedbackResult.score)}
          />
        </SummaryBlock>
        <div className="ui-sticky-actions">
          <Button type="button" onClick={props.onReplayCorrectTarget} block>
            正解の音を再生
          </Button>
          <Button
            type="button"
            onClick={props.onContinue}
            variant="primary"
            block
          >
            {props.lastAnsweredWasFinal ? "結果を見る" : "次へ"}
          </Button>
        </div>
      </Surface>
    );
  },
);

export const KeyboardResultPanel = memo(function KeyboardResultPanel(props: {
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
    <Surface tone="elevated">
      <SectionHeader
        title="結果"
        description="今回の精度と反応速度をまとめました。"
      />
      <SummaryBlock>
        <SummaryStat
          label="セッションスコア"
          value={formatScoreLabel(props.summary.sessionScore)}
          emphasis="primary"
        />
        <SummaryStat
          label="正答率"
          value={formatAccuracyLabel(props.summary.accuracyRate)}
        />
        <SummaryStat label="回答数" value={props.summary.questionCount} />
        <SummaryStat
          label="平均誤差"
          value={formatAvgErrorLabel(props.summary.avgErrorAbs)}
        />
        <SummaryStat
          label="平均回答時間"
          value={formatResponseTimeMsLabel(props.summary.avgResponseTimeMs)}
        />
        <SummaryStat
          label="終了理由"
          value={formatFinishReasonLabel(props.finishReason)}
        />
      </SummaryBlock>

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
          <strong>次のセッション</strong>
          <span className="ui-muted">設定に戻って続けて練習できます。</span>
        </div>
        <Button type="button" onClick={props.onReset} block variant="primary">
          {props.cannotSaveBecauseNoAnswers
            ? "新しいセッションを始める"
            : "もう一度始める"}
        </Button>
      </div>
    </Surface>
  );
});

const KeyboardAnswerPad = memo(function KeyboardAnswerPad(props: {
  answerChoices: NoteClass[];
  referenceNote: NoteClass;
  onAnswer: (note: NoteClass) => void;
  showLabels: boolean;
  disabled: boolean;
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
              disabled={!enabledNotes.has(note) || props.disabled}
              onClick={() => props.onAnswer(note)}
              style={getKeyboardKeyStyle(note, {
                disabled: !enabledNotes.has(note) || props.disabled,
                reference: note === props.referenceNote,
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
            disabled={!enabledNotes.has(note) || props.disabled}
            onClick={() => props.onAnswer(note)}
            style={getKeyboardKeyStyle(note, {
              disabled: !enabledNotes.has(note) || props.disabled,
              reference: note === props.referenceNote,
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
        <span
          style={legendItemStyle("var(--text-secondary)", "var(--bg-subtle)")}
        >
          マーカー=基準音
        </span>
      </div>
    </div>
  );
});

const FeedbackKeyboardView = memo(function FeedbackKeyboardView(props: {
  answeredNote: NoteClass;
  correctNote: NoteClass;
  referenceNote: NoteClass;
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
                reference: note === props.referenceNote,
                correct: note === props.correctNote,
                answered: note === props.answeredNote,
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
              reference: note === props.referenceNote,
              correct: note === props.correctNote,
              answered: note === props.answeredNote,
            })}
          >
            {props.showLabels ? <KeyLabel note={note} compact /> : null}
          </div>
        ))}
      </div>
      <div style={feedbackLegendStyle}>
        <span
          style={legendItemStyle("var(--text-secondary)", "var(--bg-subtle)")}
        >
          マーカー=基準音
        </span>
        <span style={legendItemStyle("#ffffff", "#5f8f66")}>塗り=正解</span>
        <span style={legendItemStyle("#4f8e8a", "#dceeee")}>枠=回答</span>
      </div>
    </div>
  );
});

function getKeyboardKeyStyle(
  note: NoteClass,
  options: {
    disabled?: boolean;
    reference?: boolean;
    correct?: boolean;
    answered?: boolean;
    interactive: boolean;
    left?: string;
    position?: "relative" | "absolute";
  },
): CSSProperties {
  const blackKey = isBlackKey(note);
  const fillColor = options.correct
    ? blackKey
      ? "#5f8f66"
      : "#5f8f66"
    : blackKey
      ? "#202722"
      : "#ffffff";
  const baseBorder = blackKey ? "#0f1511" : "#d8e1d8";
  const outlineColor = options.answered ? "#4f8e8a" : baseBorder;

  return {
    position: options.position ?? "relative",
    left: options.left,
    top: options.position === "absolute" ? 0 : undefined,
    width: blackKey ? "10.8%" : undefined,
    minHeight: blackKey
      ? "clamp(106px, 24vw, 148px)"
      : "clamp(170px, 42vw, 234px)",
    padding: blackKey ? "16px 4px 10px" : "18px 6px 14px",
    borderRadius: blackKey ? "0 0 12px 12px" : "0 0 16px 16px",
    border: `${options.answered ? 2 : 1}px solid ${outlineColor}`,
    background: fillColor,
    color:
      options.correct && !blackKey
        ? "#ffffff"
        : blackKey
          ? "#f4f7f4"
          : "#18201b",
    boxShadow: options.correct
      ? "0 8px 18px rgba(76, 119, 84, 0.18)"
      : blackKey
        ? "0 6px 16px rgba(24, 32, 27, 0.18)"
        : "0 4px 12px rgba(24, 32, 27, 0.06)",
    fontWeight: 700,
    fontSize: blackKey ? "11px" : "13px",
    lineHeight: 1.1,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    textAlign: "center",
    cursor: options.interactive && !options.disabled ? "pointer" : "default",
    opacity: options.disabled ? 0.45 : 1,
    touchAction: "manipulation",
    zIndex: blackKey ? 2 : 1,
    outline: options.answered ? "2px solid rgba(79, 142, 138, 0.18)" : "none",
    outlineOffset: options.answered ? "-4px" : undefined,
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
  borderRadius: "16px",
  border: "1px solid var(--border-subtle)",
  background: "var(--surface-elevated)",
  boxShadow: "var(--shadow-soft)",
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
    minHeight: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    background,
    color,
    fontSize: "12px",
    fontWeight: 700,
  };
}
