import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { AppShell, Notice, PageHeader } from "../ui/primitives";
import { LoginChoicePanel, LoginSignedInPanel } from "./login-panels";

const meta = {
  title: "Login/Panels",
  component: LoginChoicePanel,
  args: {
    isPending: false,
    errorMessage: null,
    onGoogleSignIn: fn(),
  },
  decorators: [
    (Story) => (
      <AppShell narrow>
        <PageHeader
          title="ログインして記録を残す"
          eyebrow="アカウント"
          subtitle="保存して続けるか、ゲストで今すぐ練習するかを選べます。"
        />
        <Story />
      </AppShell>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof LoginChoicePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GuestChoiceIdle: Story = {
  render: () => (
    <LoginChoicePanel
      isPending={false}
      errorMessage={null}
      onGoogleSignIn={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const googleButton = canvas.getByRole("button", {
      name: "Google でログイン",
    });
    const guestLink = canvas.getByRole("link", { name: "ゲストで始める" });

    await expect(googleButton).toBeEnabled();
    await expect(guestLink).toHaveAttribute("href", "/");
  },
};

export const GooglePending: Story = {
  render: () => (
    <LoginChoicePanel isPending errorMessage={null} onGoogleSignIn={fn()} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "接続中..." });

    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy", "true");
  },
};

export const ErrorState: Story = {
  render: () => (
    <LoginChoicePanel
      isPending={false}
      errorMessage="ログインを開始できませんでした。時間をおいてもう一度お試しください。"
      onGoogleSignIn={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "ログインを開始できませんでした。",
    );
  },
};

export const ClickStartsGoogleLogin: Story = {
  args: {
    isPending: false,
    errorMessage: null,
    onGoogleSignIn: fn(),
  },
  render: (args) => (
    <LoginChoicePanel
      isPending={false}
      errorMessage={null}
      onGoogleSignIn={args.onGoogleSignIn}
    />
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("button", { name: "Google でログイン" }),
    );
    await expect(args.onGoogleSignIn).toHaveBeenCalledTimes(1);
  },
};

export const SignedInState: Story = {
  render: () => (
    <>
      <Notice tone="success">
        すでにサインイン済みです。このアカウントで結果保存と統計を使えます。
      </Notice>
      <LoginSignedInPanel name="Mi Copi User" email="user@example.com" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Mi Copi User")).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "ホームで練習を始める" }),
    ).toHaveAttribute("href", "/");
  },
};
