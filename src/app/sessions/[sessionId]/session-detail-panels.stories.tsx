import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  createDefaultDistanceTrainingConfig,
  createDefaultKeyboardTrainingConfig,
} from "../../../features/training/model/config";
import type {
  NoteClass,
  TrainingMode,
} from "../../../features/training/model/types";
import type { TrainingSessionDetail } from "../../../features/training/server/getTrainingSessionDetail";
import { SessionDetailPanels } from "./session-detail-panels";

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
function detail(mode: TrainingMode): TrainingSessionDetail {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    mode,
    configSnapshot: {
      ...(mode === "distance"
        ? createDefaultDistanceTrainingConfig()
        : createDefaultKeyboardTrainingConfig()),
      includeUnison: true,
      endCondition: { type: "question_count", questionCount: 15 },
    },
    createdAt: "2026-10-11T10:15:03.000Z",
    endedAt: "2026-10-11T10:15:00.000Z",
    answeredQuestionCount: 15,
    correctQuestionCount: 5,
    accuracyRate: 1 / 3,
    avgErrorAbs: 2,
    avgResponseTimeMs: 2120,
    sessionScore: 1055.375,
    results: Array.from({ length: 15 }, (_, i) => {
      const target = [0, 6, 7][i % 3],
        answer = [0, 5, 12][i % 3],
        sign = i % 2 === 0 ? 1 : -1;
      return {
        id: `question-${i}`,
        questionIndex: i,
        baseNoteName: "C",
        targetNoteName: notes[(((60 + sign * target) % 12) + 12) % 12],
        answerNoteName: notes[(((60 + sign * answer) % 12) + 12) % 12],
        targetIntervalSemitones: target,
        answerIntervalSemitones: answer,
        direction: sign === 1 ? "up" : "down",
        isCorrect: target === answer,
        errorSemitones: sign * (answer - target),
        responseTimeMs: 1420 + i * 100,
      };
    }),
  };
}
const meta = {
  title: "Sessions/Complete screen",
  component: SessionDetailPanels,
  args: { detail: detail("distance"), intervalNotationStyle: "mixed" },
  decorators: [
    (Story) => (
      <div className="app-root">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SessionDetailPanels>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DistanceMixed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("問題 15", { exact: true })).toBeVisible();
    await expect(
      canvas.getAllByText("増4度 / 減5度 (A4 / d5)").length,
    ).toBeGreaterThan(0);
  },
};
export const Keyboard: Story = { args: { detail: detail("keyboard") } };
export const Empty: Story = {
  args: {
    detail: {
      ...detail("distance"),
      results: [],
      answeredQuestionCount: 0,
      correctQuestionCount: 0,
      accuracyRate: 0,
      avgErrorAbs: 0,
      avgResponseTimeMs: 0,
      sessionScore: 0,
    },
  },
};
export const LongValues: Story = {
  args: {
    detail: {
      ...detail("distance"),
      sessionScore: 987654321.875,
      avgResponseTimeMs: 123456,
      configSnapshot: {
        ...detail("distance").configSnapshot,
        baseNoteMode: "fixed",
        fixedBaseNote: "C#",
        endCondition: { type: "time_limit", timeLimitSeconds: 1800 },
      },
    },
  },
};
