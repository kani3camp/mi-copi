import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { TrainingStats } from "../../features/training/server/getTrainingStats";
import { StatsPanels } from "./stats-panels";

const performance = {
  questionCount: 60,
  correctRate: 0.65,
  averageError: 1.2,
  averageResponseTimeMs: 1680,
  averageScore: 74.2,
};
const mode = {
  ...performance,
  sessionCount: 9,
  medianError: 1,
  cumulativeScore: 642.187,
};
const trend = Array.from({ length: 10 }, (_, i) => ({
  date: `2026-10-${String(i + 1).padStart(2, "0")}`,
  questionCount: 12,
  averageScore: 60 + i * 2,
  correctRate: (55 + i) / 100,
  averageError: 2 - i * 0.1,
  averageResponseTimeMs: 2000 - i * 40,
}));
const saved: TrainingStats = {
  isAuthenticated: true,
  totalSessions: 18,
  totalSavedQuestionResults: 120,
  overview: {
    ...performance,
    questionCount: 120,
    medianError: 1,
    cumulativeScore: 1284.375,
  },
  byMode: { distance: mode, keyboard: mode },
  recentQuestionSummaries: {
    recent10: { ...performance, questionCount: 10 },
    recent30: { ...performance, questionCount: 30 },
  },
  intervalPerformance: Array.from({ length: 13 }, (_, i) => ({
    ...performance,
    intervalSemitones: i,
    averageError: i * 0.15,
  })),
  directionPerformance: { up: performance, down: performance },
  answerBias: {
    higherCount: 22,
    lowerCount: 20,
    onTargetCount: 78,
    higherRate: 0.18333,
    lowerRate: 0.16667,
    onTargetRate: 0.65,
  },
  scoreTrends: { overall: trend, distance: trend, keyboard: trend },
  dailyTrends: trend,
  recentSessions: Array.from({ length: 10 }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    mode: i % 2 ? "keyboard" : "distance",
    answeredQuestionCount: 10,
    sessionScore: 452.375,
    accuracyRate: 0.8,
    endedAt: `2026-10-${String(11 - i).padStart(2, "0")}T09:00:00.000Z`,
  })),
};
const emptyPerformance = {
  questionCount: 0,
  correctRate: 0,
  averageError: 0,
  averageResponseTimeMs: 0,
  averageScore: 0,
};
const empty: TrainingStats = {
  ...saved,
  totalSessions: 0,
  totalSavedQuestionResults: 0,
  overview: { ...emptyPerformance, medianError: 0, cumulativeScore: 0 },
  byMode: {
    distance: {
      ...emptyPerformance,
      sessionCount: 0,
      medianError: 0,
      cumulativeScore: 0,
    },
    keyboard: {
      ...emptyPerformance,
      sessionCount: 0,
      medianError: 0,
      cumulativeScore: 0,
    },
  },
  recentQuestionSummaries: {
    recent10: emptyPerformance,
    recent30: emptyPerformance,
  },
  directionPerformance: { up: emptyPerformance, down: emptyPerformance },
  answerBias: {
    higherCount: 0,
    lowerCount: 0,
    onTargetCount: 0,
    higherRate: 0,
    lowerRate: 0,
    onTargetRate: 0,
  },
  intervalPerformance: [],
  dailyTrends: [],
  scoreTrends: { overall: [], distance: [], keyboard: [] },
  recentSessions: [],
};
const meta = {
  title: "Stats/Complete Screen",
  component: StatsPanels,
  args: { stats: saved, intervalNotationStyle: "mixed" },
  decorators: [
    (Story) => (
      <div className="app-root">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatsPanels>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Saved: Story = {};
export const Empty: Story = { args: { stats: empty } };
export const Guest: Story = {
  args: { stats: { ...empty, isAuthenticated: false } },
};
export const LongValues: Story = {
  args: {
    stats: {
      ...saved,
      overview: {
        ...saved.overview,
        cumulativeScore: 987654321.875,
        averageResponseTimeMs: 123456,
      },
    },
  },
};
