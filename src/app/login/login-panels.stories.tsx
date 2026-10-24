import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import {
  LoginChoicePanel,
  LoginPageLayout,
  LoginSignedInPanel,
} from "./login-panels";

const meta = {
  title: "Login/Panels",
  component: LoginChoicePanel,
  args: {
    isPending: false,
    errorMessage: null,
    onGoogleSignIn: fn(),
  },
  decorators: [
    (Story, context) => (
      <div className="app-root">
        <LoginPageLayout isAuthenticated={Boolean(context.parameters.signedIn)}>
          <Story />
        </LoginPageLayout>
      </div>
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

    await expect(
      canvas.getByRole("heading", { name: "ログイン" }),
    ).toBeVisible();
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
  parameters: { signedIn: true },
  render: () => (
    <LoginSignedInPanel name="Mi Copi User" email="user@example.invalid" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("heading", { name: "ログイン中" }),
    ).toBeVisible();
    await expect(canvas.queryByText("ゲストで始める")).not.toBeInTheDocument();
    await expect(canvas.getByText("Mi Copi User")).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "ホームで練習を始める" }),
    ).toHaveAttribute("href", "/");
  },
};

export const SignedInLongAccountText: Story = {
  parameters: {
    signedIn: true,
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => (
    <LoginSignedInPanel
      name="練習ユーザー"
      email="student.with.a.very.long.example.name@example.invalid"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByText(
      "student.with.a.very.long.example.name@example.invalid",
    );

    await expect(email).toBeVisible();
    await expect(email.scrollWidth).toBeLessThanOrEqual(email.clientWidth);
  },
};
