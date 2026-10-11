import { type CSSProperties, memo } from "react";

import { formatResponseTimeMsLabel } from "../../../features/training/model/format";
import { formatQuestionDirectionLabel } from "../../../features/training/model/interval-notation";
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
  FeedbackControls,
  FeedbackMetrics,
  FeedbackStatusChip,
  MiniStatRow,
  PlaybackButtonPair,
  TrainingResultPersistenceSection,
  TrainingResultSummary,
} from "../train-ui-shared";
import { formatKeyboardNoteLabel } from "./keyboard-note-label";

const WHITE_KEY_NOTES: NoteClass[] = ["C", "D", "E", "F", "G", "A", "B"];

const BLACK_KEY_LAYOUT: Array<{ note: NoteClass; left: string }> = [
  { note: "C#", left: "14.2857%" },
  { note: "D#", left: "28.5714%" },
  { note: "F#", left: "57.1428%" },
  { note: "G#", left: "71.4285%" },
  { note: "A#", left: "85.7142%" },
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
      <Surface tone="accent" className="ui-question-panel">
        <SectionHeader
          title="音を聴いて鍵盤で答える"
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
      <Surface tone="elevated" className="ui-feedback-panel">
        <SectionHeader
          title="フィードバック"
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
        <FeedbackMetrics
          targetMidi={props.feedbackResult.question.targetMidi}
          answerMidi={answerMidi}
          responseTimeMs={props.feedbackResult.responseTimeMs}
          score={props.feedbackResult.score}
        />
        <FeedbackControls
          lastAnsweredWasFinal={props.lastAnsweredWasFinal}
          onReplayBase={props.onReplayBase}
          onReplayCorrectTarget={props.onReplayCorrectTarget}
          onContinue={props.onContinue}
          onEndSession={props.onEndSession}
        />
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
    <Surface className="ui-training-result">
      <TrainingResultSummary
        summary={props.summary}
        finishReason={props.finishReason}
        cannotSaveBecauseNoAnswers={props.cannotSaveBecauseNoAnswers}
        onReset={props.onReset}
      />

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
        isCorrect={props.isCorrect}
        isAnswered={props.isAnswered}
      />
    </div>
  );
}

function KeyboardKeyInner(props: {
  note: NoteClass;
  showLabels: boolean;
  isReference: boolean;
  isCorrect?: boolean;
  isAnswered?: boolean;
}) {
  return (
    <span className="ui-keyboard-key__face">
      {props.showLabels ? <KeyLabel note={props.note} /> : null}
      <span className="ui-keyboard-key__roles" aria-hidden="true">
        {props.isReference ? (
          <span
            className="ui-keyboard-key__role ui-keyboard-key__reference-badge"
            data-role="reference"
          >
            ◆
          </span>
        ) : null}
        {props.isCorrect ? (
          <span className="ui-keyboard-key__role" data-role="correct">
            ○
          </span>
        ) : null}
        {props.isAnswered ? (
          <span className="ui-keyboard-key__role" data-role="answered">
            △
          </span>
        ) : null}
      </span>
      <span className="ui-keyboard-key__bands" aria-hidden="true">
        {props.isReference ? (
          <span className="ui-keyboard-key__band" data-role="reference" />
        ) : null}
        {props.isCorrect ? (
          <span className="ui-keyboard-key__band" data-role="correct" />
        ) : null}
        {props.isAnswered ? (
          <span className="ui-keyboard-key__band" data-role="answered" />
        ) : null}
      </span>
    </span>
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
