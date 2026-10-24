import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { calculateQuestionScoreV1 } from "../../features/training/model/scoring";
import type {
  NoteClass,
  QuestionDirection,
} from "../../features/training/model/types";
import { ButtonLink } from "../ui/navigation-link";
import { AppShell } from "../ui/primitives";
import {
  DistanceFeedbackPanel,
  DistanceQuestionPanel,
} from "./distance/distance-train-panels";
import {
  KeyboardFeedbackPanel,
  KeyboardQuestionPanel,
} from "./keyboard/keyboard-train-panels";
import {
  createDistanceResult,
  createKeyboardResult,
} from "./train-story-fixtures";
import { TrainingProgressHeader } from "./training-page-shell";

const notes: NoteClass[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const handlers = {
  onEndSession: fn(),
  onReplayBase: fn(),
  onReplayCorrectTarget: fn(),
  onContinue: fn(),
};
function TrainingScreen(props: {
  mode: "distance" | "keyboard";
  answering: boolean;
  correct: number;
  answer: number;
  base: number;
  unison: boolean;
  showLabels: boolean;
  down: boolean;
}) {
  const direction: QuestionDirection = props.down ? "down" : "up";
  const baseMidi = 60 + props.base;
  const targetMidi = baseMidi + (props.down ? -props.correct : props.correct);
  const answerMidi = baseMidi + (props.down ? -props.answer : props.answer);
  const result = {
    question: {
      baseMidi,
      baseNote: notes[props.base],
      targetMidi,
      targetNote: notes[((targetMidi % 12) + 12) % 12],
      distanceSemitones: props.correct,
      direction,
    },
    answeredDistanceSemitones: props.answer,
    errorSemitones: answerMidi - targetMidi,
    responseTimeMs: 1420,
    score: calculateQuestionScoreV1({
      errorSemitones: answerMidi - targetMidi,
      responseTimeMs: 1420,
      targetIntervalSemitones: props.correct,
    }),
    isCorrect: props.answer === props.correct,
  };
  const choices = Array.from(
    { length: props.unison ? 13 : 12 },
    (_, i) => i + (props.unison ? 0 : 1),
  );
  return (
    <div className="app-root">
      <AppShell narrow className="ui-train-shell">
        <TrainingProgressHeader
          modeLabel={props.mode === "distance" ? "距離モード" : "鍵盤モード"}
          questionLabel="問題 2 / 5"
          actions={
            <ButtonLink href="/" size="compact" variant="ghost">
              戻る
            </ButtonLink>
          }
          notice="ゲストでは保存されません。"
          meta={
            <div className="ui-training-progress-meta">
              <div className="ui-training-progress-meta__item">
                <span className="ui-training-progress-meta__label">スコア</span>
                <strong className="ui-training-progress-meta__value">
                  174
                </strong>
              </div>
            </div>
          }
        />
        {props.mode === "distance" ? (
          props.answering ? (
            <DistanceQuestionPanel
              isPlaybackLocked={false}
              questionIndex={1}
              direction={direction}
              replayBaseCount={1}
              replayTargetCount={0}
              answerChoiceRows={[
                choices.slice(0, Math.ceil(choices.length / 2)),
                choices.slice(Math.ceil(choices.length / 2)),
              ]}
              intervalNotationStyle="mixed"
              onReplayBase={fn()}
              onReplayTarget={fn()}
              onAnswer={fn()}
            />
          ) : (
            <DistanceFeedbackPanel
              feedbackResult={createDistanceResult(result)}
              lastAnsweredWasFinal={false}
              intervalNotationStyle="mixed"
              {...handlers}
            />
          )
        ) : props.answering ? (
          <KeyboardQuestionPanel
            isPlaybackLocked={false}
            questionIndex={1}
            direction={direction}
            replayBaseCount={1}
            replayTargetCount={0}
            answerChoices={notes}
            referenceNote={notes[props.base]}
            showLabels={props.showLabels}
            onReplayBase={fn()}
            onReplayTarget={fn()}
            onAnswer={fn()}
          />
        ) : (
          <KeyboardFeedbackPanel
            feedbackResult={createKeyboardResult({
              ...result,
              answeredNote: notes[((answerMidi % 12) + 12) % 12],
            })}
            lastAnsweredWasFinal={false}
            showLabels={props.showLabels}
            {...handlers}
          />
        )}
      </AppShell>
    </div>
  );
}
const meta = {
  title: "Train/Complete Screen",
  component: TrainingScreen,
  args: {
    mode: "distance",
    answering: false,
    correct: 7,
    answer: 6,
    base: 0,
    unison: false,
    showLabels: true,
    down: false,
  },
} satisfies Meta<typeof TrainingScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DistanceAnswering: Story = { args: { answering: true } };
export const DistanceAllChoices: Story = {
  args: { answering: true, unison: true },
};
export const DistanceExact: Story = { args: { answer: 7 } };
export const DistanceNear: Story = {};
export const DistanceLarge: Story = { args: { answer: 1 } };
export const DistanceReference: Story = { args: { answer: 0 } };
export const DistanceUnison: Story = { args: { correct: 0, answer: 0 } };
export const DistanceDownward: Story = { args: { down: true } };
export const KeyboardAnswering: Story = {
  args: { mode: "keyboard", answering: true, base: 1 },
};
export const KeyboardExact: Story = {
  args: { mode: "keyboard", answer: 7, base: 1 },
};
export const KeyboardNear: Story = { args: { mode: "keyboard", base: 1 } };
export const KeyboardLarge: Story = {
  args: { mode: "keyboard", answer: 1, base: 1 },
};
export const KeyboardReference: Story = {
  args: { mode: "keyboard", answer: 0, base: 1 },
};
export const KeyboardTriple: Story = {
  args: { mode: "keyboard", correct: 0, answer: 0, base: 1 },
};
export const KeyboardHiddenLabels: Story = {
  args: { mode: "keyboard", base: 1, showLabels: false },
};
