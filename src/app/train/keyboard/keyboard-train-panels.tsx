import { type CSSProperties, memo } from "react";

import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  formatPitchComparisonSemitoneLabel,
  formatQuestionDirectionLabel,
} from "../../../features/training/model/interval-notation";
import type {
  KeyboardGuestResult,
  KeyboardGuestSummary,
} from "../../../features/training/model/keyboard-guest";
import { getTargetMidi } from "../../../features/training/model/pitch";
import type {
  NoteClass,
  QuestionDirection,
  SessionFinishReason,
} from "../../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  Button,
  Chip,
  Notice,
  SectionHeader,
  SummaryBlock,
  SummaryStat,
  Surface,
} from "../../ui/primitives";
import {
  FeedbackStatusChip,
  formatFinishReasonLabel,
  MiniStatRow,
  PlaybackButtonPair,
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
    isPlaybackLocked: boolean;
    questionIndex: number;
    direction: QuestionDirection;
    replayBaseCount: number;
    replayTargetCount: number;
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
          title="音を聴いて鍵盤で答える"
          description="基準音キーを見て、問題音の鍵盤をひとつ選びます。"
          eyebrow={`問題 ${props.questionIndex + 1}`}
          actions={
            <Chip tone="neutral">
              {formatQuestionDirectionLabel(props.direction)}
            </Chip>
          }
        />
        <PlaybackButtonPair
          isPlaybackLocked={props.isPlaybackLocked}
          onReplayBase={props.onReplayBase}
          onReplayTarget={props.onReplayTarget}
        />
        <MiniStatRow
          items={[
            {
              id: "direction",
              label: "方向",
              value: formatQuestionDirectionLabel(props.direction),
            },
            {
              id: "reference-note",
              label: "基準音",
              value: `${props.referenceNote} / ${props.replayBaseCount}回`,
            },
            {
              id: "target-replay-count",
              label: "問題音",
              value: `${props.replayTargetCount}回`,
            },
          ]}
        />
        <KeyboardAnswerPad
          answerChoices={props.answerChoices}
          disabled={props.isPlaybackLocked}
          onAnswer={props.onAnswer}
          referenceNote={props.referenceNote}
          showLabels={props.showLabels}
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
    onEndSession: () => void;
    onReplayBase: () => void;
    onReplayCorrectTarget: () => void;
    onContinue: () => void;
  }) {
    const answerMidi = getTargetMidi(
      props.feedbackResult.question.baseMidi,
      props.feedbackResult.question.direction,
      props.feedbackResult.answeredDistanceSemitones,
    );

    return (
      <Surface tone="elevated">
        <SectionHeader
          title="フィードバック"
          description="正解と回答の差を確認して、次の問題へ進みます。"
          actions={
            <FeedbackStatusChip
              errorSemitones={props.feedbackResult.errorSemitones}
            />
          }
        />
        <SummaryBlock className="ui-feedback-answer-block">
          <SummaryStat
            label="正解"
            value={formatKeyboardNoteLabel(
              props.feedbackResult.question.targetNote,
            )}
            emphasis="primary"
            tone="success"
          />
          <SummaryStat
            label="回答"
            value={formatKeyboardNoteLabel(props.feedbackResult.answeredNote)}
            tone="teal"
          />
        </SummaryBlock>
        <FeedbackKeyboardView
          answeredNote={props.feedbackResult.answeredNote}
          correctNote={props.feedbackResult.question.targetNote}
          referenceNote={props.feedbackResult.question.baseNote}
          showLabels={props.showLabels}
        />
        <SummaryBlock className="ui-feedback-metrics-block">
          <SummaryStat
            label="誤差"
            value={formatPitchComparisonSemitoneLabel({
              targetMidi: props.feedbackResult.question.targetMidi,
              answerMidi,
            })}
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
          <PlaybackButtonPair
            isPlaybackLocked={false}
            onReplayBase={props.onReplayBase}
            onReplayTarget={props.onReplayCorrectTarget}
            targetLabel="正解音"
          />
          <Button
            type="button"
            onClick={props.onContinue}
            variant="primary"
            block
          >
            {props.lastAnsweredWasFinal ? "結果を見る" : "次へ"}
          </Button>
          <Button
            type="button"
            onClick={props.onEndSession}
            block
            variant="ghost"
          >
            ここで終了
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
      <div className="ui-result-hero">
        <span className="ui-result-hero__label">セッションスコア</span>
        <strong className="ui-result-hero__value">
          {formatScoreLabel(props.summary.sessionScore)}
        </strong>
        <div className="ui-result-hero__meta">
          <Chip tone="neutral">
            {formatFinishReasonLabel(props.finishReason)}
          </Chip>
        </div>
      </div>
      <SummaryBlock className="ui-result-stats-block">
        <SummaryStat
          label="正答率"
          value={formatAccuracyLabel(props.summary.accuracyRate)}
          tone="success"
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

      <div className="ui-result-next-step">
        <div className="ui-stack-sm">
          <strong>次の練習</strong>
          <span className="ui-muted">
            設定に戻って、同じ条件でも別条件でもすぐ続けられます。
          </span>
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
    <div
      className="ui-keyboard-pad"
      data-labels={props.showLabels ? "visible" : "hidden"}
    >
      <div className="ui-keyboard-pad__shell">
        <div className="ui-keyboard-pad__white-row">
          {WHITE_KEY_NOTES.map((note) => (
            <KeyboardAnswerKey
              key={note}
              note={note}
              disabled={!enabledNotes.has(note) || props.disabled}
              interactive
              isReference={note === props.referenceNote}
              onAnswer={props.onAnswer}
              showLabels={props.showLabels}
            />
          ))}
        </div>
        <div className="ui-keyboard-pad__black-row">
          {BLACK_KEY_LAYOUT.map(({ left, note }) => (
            <KeyboardAnswerKey
              key={note}
              note={note}
              disabled={!enabledNotes.has(note) || props.disabled}
              interactive
              isReference={note === props.referenceNote}
              onAnswer={props.onAnswer}
              showLabels={props.showLabels}
              left={left}
            />
          ))}
        </div>
      </div>
      <KeyboardLegend
        items={[
          {
            label: "基準音",
            tone: "reference",
          },
        ]}
      />
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
    <div
      className="ui-keyboard-pad"
      data-labels={props.showLabels ? "visible" : "hidden"}
    >
      <div className="ui-keyboard-pad__shell">
        <div className="ui-keyboard-pad__white-row">
          {WHITE_KEY_NOTES.map((note) => (
            <KeyboardDisplayKey
              key={note}
              note={note}
              showLabels={props.showLabels}
              isAnswered={note === props.answeredNote}
              isCorrect={note === props.correctNote}
              isReference={note === props.referenceNote}
            />
          ))}
        </div>
        <div className="ui-keyboard-pad__black-row" aria-hidden="true">
          {BLACK_KEY_LAYOUT.map(({ left, note }) => (
            <KeyboardDisplayKey
              key={note}
              note={note}
              showLabels={props.showLabels}
              isAnswered={note === props.answeredNote}
              isCorrect={note === props.correctNote}
              isReference={note === props.referenceNote}
              left={left}
            />
          ))}
        </div>
      </div>
      <KeyboardLegend
        items={[
          { label: "基準音", tone: "reference" },
          { label: "正解", tone: "correct" },
          { label: "回答", tone: "answered" },
        ]}
      />
    </div>
  );
});

function KeyboardAnswerKey(props: {
  note: NoteClass;
  disabled: boolean;
  interactive: true;
  isReference: boolean;
  showLabels: boolean;
  onAnswer: (note: NoteClass) => void;
  left?: string;
}) {
  return (
    <button
      type="button"
      aria-label={formatKeyboardNoteLabel(props.note)}
      className="ui-keyboard-key"
      data-note={props.note}
      data-black={isBlackKey(props.note) ? "true" : "false"}
      data-reference={props.isReference ? "true" : "false"}
      data-labels={props.showLabels ? "visible" : "hidden"}
      disabled={props.disabled}
      onClick={() => props.onAnswer(props.note)}
      style={getKeyboardLeftStyle(props.left)}
    >
      <KeyboardKeyInner
        note={props.note}
        showLabels={props.showLabels}
        isReference={props.isReference}
      />
    </button>
  );
}

function KeyboardDisplayKey(props: {
  note: NoteClass;
  showLabels: boolean;
  isReference: boolean;
  isCorrect: boolean;
  isAnswered: boolean;
  left?: string;
}) {
  const isExactMatch = props.isCorrect && props.isAnswered;

  return (
    <div
      aria-hidden="true"
      className="ui-keyboard-key"
      data-note={props.note}
      data-black={isBlackKey(props.note) ? "true" : "false"}
      data-reference={props.isReference ? "true" : "false"}
      data-correct={props.isCorrect ? "true" : "false"}
      data-answered={props.isAnswered ? "true" : "false"}
      data-match={isExactMatch ? "true" : "false"}
      data-labels={props.showLabels ? "visible" : "hidden"}
      style={getKeyboardLeftStyle(props.left)}
    >
      <KeyboardKeyInner
        note={props.note}
        showLabels={props.showLabels}
        isReference={props.isReference}
      />
    </div>
  );
}

function KeyboardKeyInner(props: {
  note: NoteClass;
  showLabels: boolean;
  isReference: boolean;
}) {
  return (
    <>
      {props.showLabels ? <KeyLabel note={props.note} /> : null}
      {props.isReference ? (
        <span className="ui-keyboard-key__reference-badge" aria-hidden="true">
          基準
        </span>
      ) : null}
    </>
  );
}

function KeyboardLegend(props: {
  items: Array<{
    label: string;
    tone: "reference" | "correct" | "answered";
  }>;
}) {
  return (
    <div className="ui-keyboard-legend">
      {props.items.map((item) => (
        <span
          key={item.label}
          className="ui-keyboard-legend__item"
          data-tone={item.tone}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

function getKeyboardLeftStyle(left?: string): CSSProperties | undefined {
  if (!left) {
    return undefined;
  }

  return { "--keyboard-left": left } as CSSProperties;
}

function KeyLabel(props: { note: NoteClass }) {
  if (isBlackKey(props.note)) {
    const [sharp, flat] = formatKeyboardNoteLabel(props.note).split(" / ");

    return (
      <span className="ui-keyboard-key__label ui-keyboard-key__label--dual">
        <span>{sharp}</span>
        <span>{flat}</span>
      </span>
    );
  }

  return <span className="ui-keyboard-key__label">{props.note}</span>;
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
