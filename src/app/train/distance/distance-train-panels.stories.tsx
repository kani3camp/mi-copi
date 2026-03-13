import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { AppShell } from "../../ui/primitives";
import {
  createDistanceResult,
  createDistanceSummary,
} from "../train-story-fixtures";
import {
  DistanceFeedbackPanel,
  DistanceQuestionPanel,
  DistanceResultPanel,
} from "./distance-train-panels";

interface DistancePanelStoryArgs {
  onReplayBase: () => void;
  onReplayTarget: () => void;
  onAnswer: (value: number) => void;
  onReplayCorrectTarget: () => void;
  onContinue: () => void;
  onRetrySave: () => void;
  onReset: () => void;
}

const baseResults = [
  createDistanceResult(),
  createDistanceResult({
    question: {
      questionIndex: 1,
      direction: "down",
      baseNote: "F",
      baseMidi: 65,
      targetNote: "D",
      targetMidi: 62,
      distanceSemitones: 3,
    },
    answeredDistanceSemitones: 4,
    isCorrect: false,
    errorSemitones: 1,
    responseTimeMs: 2020,
    score: 68.2,
    answeredAt: "2026-03-12T10:02:02.020Z",
  }),
];

const meta = {
  title: "Train/Distance/Panels",
  decorators: [
    (Story) => (
      <AppShell narrow className="ui-train-shell">
        <Story />
      </AppShell>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<DistancePanelStoryArgs>;

export default meta;

type Story = StoryObj<DistancePanelStoryArgs>;

export const Answering: Story = {
  render: (args) => (
    <DistanceQuestionPanel
      phase="answering"
      questionIndex={2}
      direction="up"
      replayBaseCount={1}
      replayTargetCount={0}
      playbackKind="question"
      answerChoiceValues={[0, 3, 5, 7, 12]}
      intervalNotationStyle="ja"
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
    await userEvent.click(canvas.getByRole("button", { name: "完全5度" }));

    await expect(args.onReplayBase).toHaveBeenCalledTimes(1);
    await expect(args.onReplayTarget).toHaveBeenCalledTimes(1);
    await expect(args.onAnswer).toHaveBeenCalledWith(7);
  },
};

export const FeedbackIncorrect: Story = {
  render: (args) => (
    <DistanceFeedbackPanel
      feedbackResult={createDistanceResult({
        answeredDistanceSemitones: 5,
        isCorrect: false,
        errorSemitones: -2,
        score: 52.4,
      })}
      lastAnsweredWasFinal={false}
      intervalNotationStyle="ja"
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

    await expect(canvas.getByText("ずれあり")).toBeVisible();
    await expect(canvas.getByText("完全5度")).toBeVisible();
    await expect(canvas.getByText("完全4度")).toBeVisible();
    await expect(canvas.queryByText("方向が逆")).toBeNull();
    await expect(canvas.queryByText("方向は正しい")).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "正解の音を再生" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "次へ" }));

    await expect(args.onReplayCorrectTarget).toHaveBeenCalledTimes(1);
    await expect(args.onContinue).toHaveBeenCalledTimes(1);
  },
};

export const FeedbackIncorrectDownward: Story = {
  render: (args) => (
    <DistanceFeedbackPanel
      feedbackResult={createDistanceResult({
        question: {
          direction: "down",
          distanceSemitones: 5,
          baseNote: "F",
          baseMidi: 65,
          targetNote: "C",
          targetMidi: 60,
        },
        answeredDistanceSemitones: 3,
        isCorrect: false,
        errorSemitones: -2,
        score: 52.4,
      })}
      lastAnsweredWasFinal={false}
      intervalNotationStyle="ja"
      onReplayCorrectTarget={args.onReplayCorrectTarget}
      onContinue={args.onContinue}
    />
  ),
  args: {
    onReplayCorrectTarget: fn(),
    onContinue: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByLabelText("距離フィードバック: 0 が基準音、下方向"),
    ).toBeVisible();
    await expect(canvas.getByText("ずれあり")).toBeVisible();
    await expect(canvas.getByText("完全4度")).toBeVisible();
    await expect(canvas.getByText("短3度")).toBeVisible();
    await expect(canvas.queryByText("方向が逆")).toBeNull();
    await expect(canvas.getByText("正解")).toBeVisible();
    await expect(canvas.getByText("回答")).toBeVisible();
    await expect(canvas.getByText("基準音")).toBeVisible();
  },
};

export const FeedbackExactMatch: Story = {
  render: (args) => (
    <DistanceFeedbackPanel
      feedbackResult={createDistanceResult({
        question: {
          distanceSemitones: 2,
        },
        answeredDistanceSemitones: 2,
        isCorrect: true,
        errorSemitones: 0,
        score: 100,
      })}
      lastAnsweredWasFinal={true}
      intervalNotationStyle="ja"
      onReplayCorrectTarget={args.onReplayCorrectTarget}
      onContinue={args.onContinue}
    />
  ),
  args: {
    onReplayCorrectTarget: fn(),
    onContinue: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("完全一致")).toBeVisible();
    await expect(canvas.getAllByText("長2度")).toHaveLength(2);
    await expect(canvas.getAllByText(/正解|回答/)).toHaveLength(2);
  },
};

export const ResultGuest: Story = {
  render: (args) => (
    <DistanceResultPanel
      summary={createDistanceSummary(baseResults)}
      recentResults={[...baseResults].reverse()}
      intervalNotationStyle="ja"
      finishReason="target_reached"
      isAuthenticated={false}
      canSaveResult={false}
      cannotSaveBecauseNoAnswers={false}
      isSavePending={false}
      saveResult={null}
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
      canvas.getByText("ゲスト利用のため、この結果は保存されません。"),
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "今後の保存用にログイン" }),
    ).toBeVisible();

    await userEvent.click(
      canvas.getByRole("button", { name: "もう一度始める" }),
    );
    await expect(args.onReset).toHaveBeenCalledTimes(1);
  },
};

export const ResultSaveFailure: Story = {
  render: (args) => (
    <DistanceResultPanel
      summary={createDistanceSummary(baseResults)}
      recentResults={[...baseResults].reverse()}
      intervalNotationStyle="ja"
      finishReason="time_up"
      isAuthenticated
      canSaveResult
      cannotSaveBecauseNoAnswers={false}
      isSavePending={false}
      saveResult={{
        ok: false,
        code: "SAVE_FAILED",
        message: "Failed to persist the training session.",
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
      canvas.getByText("結果を保存できませんでした。もう一度お試しください。"),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "保存を再試行" }));

    await expect(args.onRetrySave).toHaveBeenCalledTimes(1);
  },
};
