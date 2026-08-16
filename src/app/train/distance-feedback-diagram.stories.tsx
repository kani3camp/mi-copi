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
    await expectDiagram(canvasElement, "上方向");
  },
};

export const CloseMissLower: Story = {
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 4,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
  },
};

export const ExactMatch: Story = {
  args: {
    direction: "up",
    correctSemitones: 2,
    answeredSemitones: 2,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
  },
};

export const AnswerAtBase: Story = {
  args: {
    direction: "up",
    correctSemitones: 3,
    answeredSemitones: 0,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
  },
};

export const BoundaryCase: Story = {
  args: {
    direction: "down",
    correctSemitones: 12,
    answeredSemitones: 11,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "下方向");
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
    await expectDiagram(canvasElement, "上方向");
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
    await expectDiagram(canvasElement, "下方向");
  },
};

async function expectDiagram(
  canvasElement: HTMLElement,
  directionLabel: "上方向" | "下方向",
) {
  const canvas = within(canvasElement);

  await expect(
    canvas.getByRole("img", {
      name: `距離フィードバック: 0 が基準音、${directionLabel}`,
    }),
  ).toBeVisible();
  await expect(getDiagramAnnotationLabels(canvasElement)).toEqual(
    expect.arrayContaining(["基準音", "正解", "回答"]),
  );
}

function getDiagramAnnotationLabels(root: ParentNode): string[] {
  return Array.from(
    root.querySelectorAll<SVGTextElement>(".ui-distance-diagram__svg text"),
    (label) => label.textContent?.trim() ?? "",
  );
}
