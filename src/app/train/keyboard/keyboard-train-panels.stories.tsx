import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { AppShell } from "../../ui/primitives";
import {
  createKeyboardResult,
  createKeyboardSummary,
} from "../train-story-fixtures";
import {
  KeyboardFeedbackPanel,
  KeyboardQuestionPanel,
  KeyboardResultPanel,
} from "./keyboard-train-panels";

interface KeyboardPanelStoryArgs {
  onReplayBase: () => void;
  onReplayTarget: () => void;
  onAnswer: (note: string) => void;
  onReplayCorrectTarget: () => void;
  onContinue: () => void;
  onRetrySave: () => void;
  onReset: () => void;
}

const baseResults = [
  createKeyboardResult(),
  createKeyboardResult({
    question: {
      questionIndex: 1,
      direction: "down",
      baseNote: "A",
      baseMidi: 69,
      targetNote: "F",
      targetMidi: 65,
      distanceSemitones: 4,
    },
    answeredNote: "F#",
    answeredDistanceSemitones: 3,
    isCorrect: false,
    errorSemitones: -1,
    responseTimeMs: 1880,
    score: 72.8,
    answeredAt: "2026-03-12T10:02:01.880Z",
  }),
];

const meta = {
  title: "Train/Keyboard/Panels",
  decorators: [
    (Story) => (
      <AppShell narrow className="ui-train-shell">
        <Story />
      </AppShell>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<KeyboardPanelStoryArgs>;

export default meta;

type Story = StoryObj<KeyboardPanelStoryArgs>;

export const AnsweringWithReferenceKey: Story = {
  render: (args) => (
    <KeyboardQuestionPanel
      phase="answering"
      questionIndex={1}
      direction="down"
      replayBaseCount={0}
      replayTargetCount={1}
      playbackKind="question"
      answerChoices={[
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
      ]}
      referenceNote="C"
      showLabels
      onReplayBase={args.onReplayBase}
      onReplayTarget={args.onReplayTarget}
      onAnswer={args.onAnswer}
    />
  ),
  args: {
    onReplayBase: fn(),
    onReplayTarget: fn(),
    onAnswer: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "基準音を再生" }));
    await userEvent.click(canvas.getByRole("button", { name: "問題音を再生" }));
    await userEvent.click(canvas.getByRole("button", { name: "G" }));

    await expect(args.onReplayBase).toHaveBeenCalledTimes(1);
    await expect(args.onReplayTarget).toHaveBeenCalledTimes(1);
    await expect(args.onAnswer).toHaveBeenCalledWith("G");
  },
};

export const FeedbackIncorrect: Story = {
  render: (args) => (
    <KeyboardFeedbackPanel
      feedbackResult={createKeyboardResult({
        answeredNote: "F#",
        answeredDistanceSemitones: 6,
        isCorrect: false,
        errorSemitones: -1,
        score: 74.5,
      })}
      lastAnsweredWasFinal
      showLabels
      onReplayCorrectTarget={args.onReplayCorrectTarget}
      onContinue={args.onContinue}
    />
  ),
  args: {
    onReplayCorrectTarget: fn(),
    onContinue: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("button", { name: "正解の音を再生" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "結果を見る" }));

    await expect(args.onReplayCorrectTarget).toHaveBeenCalledTimes(1);
    await expect(args.onContinue).toHaveBeenCalledTimes(1);
  },
};

export const ResultSaveSuccess: Story = {
  render: (args) => (
    <KeyboardResultPanel
      summary={createKeyboardSummary(baseResults)}
      finishReason="target_reached"
      isAuthenticated
      canSaveResult
      cannotSaveBecauseNoAnswers={false}
      isSavePending={false}
      saveResult={{
        ok: true,
        sessionId: "session-storybook-1",
        savedQuestionCount: 2,
      }}
      onRetrySave={args.onRetrySave}
      onReset={args.onReset}
    />
  ),
  args: {
    onRetrySave: fn(),
    onReset: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("link", { name: "セッション詳細を見る" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "もう一度始める" }),
    );
    await expect(args.onReset).toHaveBeenCalledTimes(1);
  },
};

export const ResultSaveFailure: Story = {
  render: (args) => (
    <KeyboardResultPanel
      summary={createKeyboardSummary(baseResults)}
      finishReason="time_up"
      isAuthenticated
      canSaveResult
      cannotSaveBecauseNoAnswers={false}
      isSavePending={false}
      saveResult={{
        ok: false,
        code: "INVALID_INPUT",
        message: "answeredQuestionCount must match results.length.",
      }}
      onRetrySave={args.onRetrySave}
      onReset={args.onReset}
    />
  ),
  args: {
    onRetrySave: fn(),
    onReset: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(
        "セッション情報が不足しているため、この結果は保存できませんでした。",
      ),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "保存を再試行" }));

    await expect(args.onRetrySave).toHaveBeenCalledTimes(1);
  },
};
