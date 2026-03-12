import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppShell, KeyValueCard } from "../ui/primitives";
import { TrainingPageHero } from "./training-page-shell";

const meta = {
  title: "Train/TrainingPageHero",
  component: TrainingPageHero,
  decorators: [
    (Story) => (
      <AppShell narrow className="ui-train-shell">
        <Story />
      </AppShell>
    ),
  ],
  tags: ["autodocs"],
  args: {
    title: "距離モード",
    subtitle:
      "設定から結果表示まで、距離モードの MVP セッションを 1 画面内で進められます。",
    phase: "answering",
    phaseLabel: "回答中",
    children: (
      <div className="ui-train-status-grid">
        <KeyValueCard label="進行状態" value="回答中" />
        <KeyValueCard label="開始時刻" value="2026/03/12 10:00" />
        <KeyValueCard label="残り時間" value="0:47" />
      </div>
    ),
  },
} satisfies Meta<typeof TrainingPageHero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Answering: Story = {};
