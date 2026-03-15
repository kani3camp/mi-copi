import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { AppShell, Surface } from "../ui/primitives";
import { ResetConfigSubmitButton } from "./reset-config-submit-button";

const meta = {
  title: "Settings/ResetConfigSubmitButton",
  decorators: [
    (Story) => (
      <AppShell narrow>
        <Surface>
          <Story />
        </Surface>
      </AppShell>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function ResetFormStory() {
  const [completed, setCompleted] = useState(false);

  return (
    <form
      action={async () => {
        setCompleted(false);
        await new Promise((resolve) => {
          window.setTimeout(resolve, 250);
        });
        setCompleted(true);
      }}
      className="ui-stack-md"
    >
      <ResetConfigSubmitButton>
        距離モードを初期値に戻す
      </ResetConfigSubmitButton>
      {completed ? <p className="ui-muted">リセット完了</p> : null}
    </form>
  );
}

export const Pending: Story = {
  render: () => <ResetFormStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("button", { name: "距離モードを初期値に戻す" }),
    );

    await expect(
      canvas.getByRole("button", { name: "リセット中..." }),
    ).toBeDisabled();

    await waitFor(() => {
      expect(canvas.getByText("リセット完了")).toBeVisible();
    });
  },
};
