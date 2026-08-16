import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, within } from "storybook/test";

import { DistanceFeedbackDiagram } from "./train-ui-shared";

type DiagramDirection = "up" | "down" | "unison";

type DiagramArgs = {
  direction: DiagramDirection;
  correctSemitones: number;
  answeredSemitones: number;
  answeredDirection?: DiagramDirection;
};

const meta = {
  title: "Train/Distance/Interval Ruler",
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

export const Upward: Story = {
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 3,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
  },
};

export const Downward: Story = {
  args: {
    direction: "down",
    correctSemitones: 5,
    answeredSemitones: 3,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "下方向");
  },
};

export const Unison: Story = {
  args: {
    direction: "unison",
    correctSemitones: 0,
    answeredSemitones: 0,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "同音");
  },
};

export const OneSemitoneHigher: Story = {
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 6,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
  },
};

export const OneSemitoneLower: Story = {
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 4,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
  },
};

export const LargeError: Story = {
  args: {
    direction: "up",
    correctSemitones: 2,
    answeredSemitones: 11,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
  },
};

export const ReverseDirectionAnswer: Story = {
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 3,
    answeredDirection: "down",
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
    await expect(
      canvasElement.querySelector('[data-answer-direction="down"]'),
    ).not.toBeNull();
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
    await expect(
      canvasElement.querySelector('[data-exact-match="true"]'),
    ).not.toBeNull();
  },
};

export const AnswerAtReference: Story = {
  args: {
    direction: "up",
    correctSemitones: 3,
    answeredSemitones: 0,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
  },
};

export const OctaveBoundary: Story = {
  args: {
    direction: "down",
    correctSemitones: 12,
    answeredSemitones: 11,
  },
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "下方向");
  },
};

export const NarrowMobile360: Story = {
  args: {
    direction: "up",
    correctSemitones: 5,
    answeredSemitones: 3,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expectDiagram(canvasElement, "上方向");
  },
};

export const NarrowMobile390: Story = {
  args: {
    direction: "down",
    correctSemitones: 4,
    answeredSemitones: 2,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390, maxWidth: "100%" }}>
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
  directionLabel: "上方向" | "下方向" | "同音",
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
