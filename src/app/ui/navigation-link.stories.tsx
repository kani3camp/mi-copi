import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { ButtonLink, ListLinkCard } from "./navigation-link";
import { AppShell, TrainingModeChip } from "./primitives";

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
      href="/sessions/session-1"
      pendingLabel="セッション詳細を開いています..."
      className="ui-list-link--compact ui-list-link--session"
    >
      <div className="ui-inline-split">
        <TrainingModeChip mode="distance" />
        <strong>424</strong>
      </div>
      <span className="ui-muted">正答率 10% / 回答数 10</span>
      <span className="ui-mini-note">完了 2026/03/13 21:56</span>
    </ListLinkCard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: /424/ });

    await userEvent.click(link);

    await expect(
      canvas.getByRole("link", { name: "セッション詳細を開いています..." }),
    ).toHaveAttribute("data-pending", "true");
  },
};
