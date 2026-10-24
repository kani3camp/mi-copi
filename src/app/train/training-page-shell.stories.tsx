import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppShell } from "../ui/primitives";
import { TrainingProgressHeader } from "./training-page-shell";

const meta = {
  title: "Train/TrainingProgressHeader",
  component: TrainingProgressHeader,
  decorators: [
    (Story) => (
      <AppShell narrow className="ui-train-shell">
        <Story />
      </AppShell>
    ),
  ],
  tags: ["autodocs"],
  args: {
    modeLabel: "距離モード",
    questionLabel: "3 / 10",
    meta: (
      <div className="ui-training-progress-meta">
        <div className="ui-training-progress-meta__item" data-tone="info">
          <span className="ui-training-progress-meta__label">残り</span>
          <strong className="ui-training-progress-meta__value">0:47</strong>
        </div>
        <div className="ui-training-progress-meta__item" data-tone="brand">
          <span className="ui-training-progress-meta__label">スコア</span>
          <strong className="ui-training-progress-meta__value">184</strong>
        </div>
      </div>
    ),
    notice: "結果画面では自動保存されます。",
  },
} satisfies Meta<typeof TrainingProgressHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Answering: Story = {};
