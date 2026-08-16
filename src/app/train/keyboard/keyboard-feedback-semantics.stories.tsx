import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { fn } from "storybook/test";

import { AppShell } from "../../ui/primitives";
import { createKeyboardResult } from "../train-story-fixtures";
import { KeyboardFeedbackPanel } from "./keyboard-train-panels";

const handlers = {
  onEndSession: fn(),
  onReplayBase: fn(),
  onReplayCorrectTarget: fn(),
  onContinue: fn(),
};

const meta = {
  title: "Train/Keyboard/Semantic Feedback",
  decorators: [
    (Story) => (
      <AppShell narrow className="ui-train-shell">
        <Story />
      </AppShell>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function FeedbackStory(props: {
  baseNote: "C" | "C#" | "E";
  baseMidi: number;
  targetNote: "C#" | "F" | "F#" | "G";
  targetMidi: number;
  distanceSemitones: number;
  answeredNote: "C#" | "D" | "F" | "F#" | "G" | "G#";
  answeredDistanceSemitones: number;
  errorSemitones: number;
}) {
  return (
    <KeyboardFeedbackPanel
      feedbackResult={createKeyboardResult({
        question: {
          baseNote: props.baseNote,
          baseMidi: props.baseMidi,
          targetNote: props.targetNote,
          targetMidi: props.targetMidi,
          distanceSemitones: props.distanceSemitones,
          direction: props.distanceSemitones === 0 ? "unison" : "up",
        },
        answeredNote: props.answeredNote,
        answeredDistanceSemitones: props.answeredDistanceSemitones,
        isCorrect: props.errorSemitones === 0,
        errorSemitones: props.errorSemitones,
      })}
      lastAnsweredWasFinal={false}
      showLabels
      {...handlers}
    />
  );
}

export const WhiteKeyRoles: Story = {
  render: () => (
    <FeedbackStory
      baseNote="C"
      baseMidi={60}
      targetNote="G"
      targetMidi={67}
      distanceSemitones={7}
      answeredNote="F"
      answeredDistanceSemitones={5}
      errorSemitones={-2}
    />
  ),
};

export const BlackKeyRoles: Story = {
  render: () => (
    <FeedbackStory
      baseNote="C#"
      baseMidi={61}
      targetNote="F#"
      targetMidi={66}
      distanceSemitones={5}
      answeredNote="G#"
      answeredDistanceSemitones={7}
      errorSemitones={2}
    />
  ),
};

export const ExactMatch: Story = {
  render: () => (
    <FeedbackStory
      baseNote="C#"
      baseMidi={61}
      targetNote="F#"
      targetMidi={66}
      distanceSemitones={5}
      answeredNote="F#"
      answeredDistanceSemitones={5}
      errorSemitones={0}
    />
  ),
};

export const ReferenceAndCorrect: Story = {
  render: () => (
    <FeedbackStory
      baseNote="C#"
      baseMidi={61}
      targetNote="C#"
      targetMidi={61}
      distanceSemitones={0}
      answeredNote="D"
      answeredDistanceSemitones={1}
      errorSemitones={1}
    />
  ),
};

export const ReferenceAndAnswer: Story = {
  render: () => (
    <FeedbackStory
      baseNote="C#"
      baseMidi={61}
      targetNote="G"
      targetMidi={67}
      distanceSemitones={6}
      answeredNote="C#"
      answeredDistanceSemitones={0}
      errorSemitones={-6}
    />
  ),
};

export const AdjacentCorrectAndAnswer: Story = {
  render: () => (
    <FeedbackStory
      baseNote="E"
      baseMidi={64}
      targetNote="F"
      targetMidi={65}
      distanceSemitones={1}
      answeredNote="F#"
      answeredDistanceSemitones={2}
      errorSemitones={1}
    />
  ),
};
