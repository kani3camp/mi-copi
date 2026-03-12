import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { ButtonLink, ListLinkCard } from "./navigation-link";
import { AppShell } from "./primitives";

const meta = {
  title: "UI/NavigationLink",
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

export const ButtonPending: Story = {
  render: () => (
    <ButtonLink href="/stats" pendingLabel="統計を開いています...">
      統計を見る
    </ButtonLink>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "統計を見る" });

    await userEvent.click(link);

    await expect(
      canvas.getByRole("link", { name: "統計を開いています..." }),
    ).toHaveAttribute("aria-disabled", "true");
  },
};

export const CardPending: Story = {
  render: () => (
    <ListLinkCard
      href="/train/distance"
      pendingLabel="距離モードを開いています..."
    >
      <span className="ui-hero__eyebrow">距離モード</span>
      <strong>音程名で答える</strong>
      <span className="ui-muted">
        音程名で答える反復練習。誤差と回答速度をすぐ確認できます。
      </span>
    </ListLinkCard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: /音程名で答える/ });

    await userEvent.click(link);

    await expect(
      canvas.getByRole("link", { name: "距離モードを開いています..." }),
    ).toHaveAttribute("data-pending", "true");
  },
};
