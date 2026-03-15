import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ButtonLink } from "./navigation-link";
import {
  ActionCard,
  AppShell,
  Button,
  Chip,
  TrainingModeChip,
} from "./primitives";

const meta = {
  title: "UI/Primitives",
  decorators: [
    (Story) => (
      <AppShell narrow>
        <Story />
      </AppShell>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const ButtonsAndChips: Story = {
  render: () => (
    <div className="ui-stack-md">
      <div className="ui-page-aux-actions">
        <Button type="button" variant="primary">
          開始
        </Button>
        <Button type="button" variant="secondary">
          統計を見る
        </Button>
        <Button type="button" variant="ghost" size="compact">
          戻る
        </Button>
        <Button type="button" variant="danger" size="compact">
          ログアウト
        </Button>
      </div>
      <div className="ui-page-aux-actions">
        <Chip tone="neutral">保存なし</Chip>
        <Chip tone="brand">クラウド保存</Chip>
        <TrainingModeChip mode="distance" />
      </div>
    </div>
  ),
};

export const ActionCardWithCta: Story = {
  render: () => (
    <ActionCard
      tone="teal"
      eyebrow={<TrainingModeChip mode="distance" />}
      title="音程名で答える"
      description="半音距離と反応速度を短く繰り返し鍛えます。"
      footer={
        <ButtonLink
          href="/train/distance"
          variant="secondary"
          block
          pendingLabel="距離モードを開いています..."
        >
          練習を始める
        </ButtonLink>
      }
    />
  ),
};
