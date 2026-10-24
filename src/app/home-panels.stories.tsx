import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import type { HomeTrainingSummary } from "../features/training/server/getHomeTrainingSummary";
import { HomeHeader, HomeRecords, HomeTrainingEntries } from "./home-panels";
import { AppShell, Button } from "./ui/primitives";

const savedSummary: HomeTrainingSummary = {
  isAuthenticated: true,
  totalSessions: 3,
  totalSavedQuestionResults: 45,
  lastTrainingTime: "2026-10-10T12:42:00.000Z",
  lastUsedMode: "distance",
  latestSessionScore: 842.125,
  recentAverageError: 0.6,
  recentAverageResponseTimeMs: 1840.456,
  recentSessions: [
    {
      id: "sample-distance",
      mode: "distance",
      answeredQuestionCount: 15,
      sessionScore: 842.125,
      accuracyRate: 13 / 15,
      endedAt: "2026-10-10T12:42:00.000Z",
    },
    {
      id: "sample-keyboard",
      mode: "keyboard",
      answeredQuestionCount: 15,
      sessionScore: 716.5,
      accuracyRate: 11 / 15,
      endedAt: "2026-10-09T22:15:00.000Z",
    },
  ],
};

function HomePreview(props: { summary?: HomeTrainingSummary }) {
  const isAuthenticated = props.summary !== undefined;
  return (
    <div className="app-root">
      <AppShell className="ui-home-shell">
        <HomeHeader isAuthenticated={isAuthenticated} />
        <HomeTrainingEntries isAuthenticated={isAuthenticated} />
        {props.summary ? (
          <HomeRecords
            summary={props.summary}
            signOut={
              <Button variant="ghost" size="compact">
                ログアウト
              </Button>
            }
          />
        ) : null}
      </AppShell>
    </div>
  );
}

const meta = {
  title: "Home/Screens",
  component: HomePreview,
  tags: ["autodocs"],
} satisfies Meta<typeof HomePreview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const distance = canvas.getByRole("link", {
      name: /距離モード/,
    });
    await expect(distance).toHaveAttribute("href", "/train/distance");
    await expect(
      canvas.getByRole("link", { name: /鍵盤モード/ }),
    ).toHaveAttribute("href", "/train/keyboard");
    // The Storybook router does not expose reliable navigation mocks.
    // Verify the link remains a usable destination after clicking it.
    await userEvent.click(distance);
    await expect(distance).toHaveAttribute("href", "/train/distance");
  },
};
export const Saved: Story = { args: { summary: savedSummary } };
export const Empty: Story = {
  args: {
    summary: {
      ...savedSummary,
      totalSessions: 0,
      totalSavedQuestionResults: 0,
      lastTrainingTime: null,
      lastUsedMode: null,
      latestSessionScore: null,
      recentAverageError: null,
      recentAverageResponseTimeMs: null,
      recentSessions: [],
    },
  },
};
export const LongValues: Story = {
  args: {
    summary: {
      ...savedSummary,
      lastTrainingTime: "2099-12-31T23:59:00.000Z",
      recentAverageError: 12,
      recentAverageResponseTimeMs: 123456.789,
    },
  },
};
