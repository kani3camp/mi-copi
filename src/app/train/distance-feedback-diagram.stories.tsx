import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, within } from "storybook/test";

import { DistanceFeedbackDiagram } from "./train-ui-shared";

type DiagramArgs = {
  direction: "up" | "down";
  correctSemitones: number;
  answeredSemitones: number;
};

const meta = {
  title: "Train/Distance/Diagram",
  component: DistanceFeedbackDiagram,
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 3,
  },
  tags: ["autodocs"],
} satisfies Meta<DiagramArgs>;

export default meta;

type Story = StoryObj<DiagramArgs>;

export const CloseMissHigher: Story = {
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 6,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("正解")).toBeVisible();
    await expect(canvas.getByText("回答")).toBeVisible();
    await expect(canvas.getByText("基準音")).toBeVisible();
  },
};

export const CloseMissLower: Story = {
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 4,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("正解")).toBeVisible();
    await expect(canvas.getByText("回答")).toBeVisible();
  },
};

export const ExactMatch: Story = {
  args: {
    direction: "up",
    correctSemitones: 2,
    answeredSemitones: 2,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("正解")).toBeVisible();
    await expect(canvas.getByText("回答")).toBeVisible();
    await expect(canvas.getByText("基準音")).toBeVisible();
  },
};

export const AnswerAtBase: Story = {
  args: {
    direction: "up",
    correctSemitones: 3,
    answeredSemitones: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("正解")).toBeVisible();
    await expect(canvas.getByText("回答")).toBeVisible();
    await expect(canvas.getByText("基準音")).toBeVisible();
  },
};

export const BoundaryCase: Story = {
  args: {
    direction: "down",
    correctSemitones: 12,
    answeredSemitones: 11,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByLabelText("距離フィードバック: 0 が基準音、下方向"),
    ).toBeVisible();
    await expect(canvas.getByText("正解")).toBeVisible();
    await expect(canvas.getByText("回答")).toBeVisible();
  },
};

export const NarrowMobile320: Story = {
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 3,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("正解")).toBeVisible();
    await expect(canvas.getByText("回答")).toBeVisible();
  },
};

export const NarrowMobile375: Story = {
  args: {
    direction: "down",
    correctSemitones: 4,
    answeredSemitones: 2,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 375, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByLabelText("距離フィードバック: 0 が基準音、下方向"),
    ).toBeVisible();
    await expect(canvas.getByText("正解")).toBeVisible();
    await expect(canvas.getByText("回答")).toBeVisible();
  },
};
