import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { GlobalUserSettingsProvider } from "../../features/settings/client/global-user-settings-provider";
import { createDefaultGlobalUserSettings } from "../../features/settings/model/global-user-settings";
import {
  createDefaultDistanceTrainingConfig,
  createDefaultKeyboardTrainingConfig,
} from "../../features/training/model/config";
import type { SettingsPageData } from "../../features/training/server/getSettingsPageData";
import { SettingsPanels } from "./settings-panels";

const saved: SettingsPageData = {
  isAuthenticated: true,
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    name: "練習ユーザー",
    email: "student@example.invalid",
    image: null,
  },
  lastDistanceConfig: {
    ...createDefaultDistanceTrainingConfig(),
    endCondition: { type: "question_count", questionCount: 15 },
    includeUnison: true,
    intervalGranularity: "aug_dim",
  },
  lastKeyboardConfig: {
    ...createDefaultKeyboardTrainingConfig(),
    baseNoteMode: "fixed",
    fixedBaseNote: "C#",
    endCondition: { type: "time_limit", timeLimitSeconds: 1800 },
  },
  updatedAt: "2026-10-11T10:15:00.000Z",
};
function SettingsScreen(props: {
  data: SettingsPageData;
  resetTarget?: string;
  resetError?: string;
  saveFails: boolean;
  savePending: boolean;
}) {
  return (
    <div className="app-root">
      <GlobalUserSettingsProvider
        isAuthenticated={props.data.isAuthenticated}
        initialSettings={createDefaultGlobalUserSettings()}
        initialUpdatedAt={props.data.updatedAt}
        persistSettingsAction={async () =>
          props.savePending
            ? new Promise(() => {})
            : props.saveFails
              ? {
                  ok: false,
                  code: "SAVE_FAILED",
                  message:
                    "設定を保存できませんでした。接続状態を確認して再試行してください。",
                }
              : { ok: true, updatedAt: "2026-10-11T10:16:00.000Z" }
        }
      >
        <SettingsPanels
          data={props.data}
          resetTarget={props.resetTarget}
          resetError={props.resetError}
          resetDistanceAction={async () => {}}
          resetKeyboardAction={async () => {}}
        />
      </GlobalUserSettingsProvider>
    </div>
  );
}
const meta = {
  title: "Settings/Complete screen",
  component: SettingsScreen,
  args: { data: saved, saveFails: false, savePending: false },
} satisfies Meta<typeof SettingsScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Saved: Story = {};
export const Guest: Story = {
  args: {
    data: {
      isAuthenticated: false,
      user: null,
      lastDistanceConfig: null,
      lastKeyboardConfig: null,
      updatedAt: null,
    },
  },
};
export const EmptySaved: Story = {
  args: {
    data: {
      ...saved,
      lastDistanceConfig: null,
      lastKeyboardConfig: null,
      updatedAt: null,
    },
  },
};
export const LongAccount: Story = {
  args: {
    data: {
      ...saved,
      user: {
        ...saved.user!,
        name: "練習ユーザーの長い表示名",
        email: "student.with.a.very.long.example.name@example.invalid",
      },
    },
  },
};
export const ResetSuccess: Story = { args: { resetTarget: "distance" } };
export const ResetError: Story = { args: { resetError: "keyboard" } };
export const AutoSave: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("混在", { exact: true }));
    await expect(canvas.getByRole("radio", { name: "混在" })).toBeChecked();
    await expect(
      canvas.getByText("最新の設定はクラウドへ保存済みです。"),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("checkbox", { name: /効果音/ }));
    await expect(
      canvas.getByRole("checkbox", { name: /効果音/ }),
    ).not.toBeChecked();
  },
};
export const SaveError: Story = {
  args: { saveFails: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("略称", { exact: true }));
    await expect(
      canvas.getByRole("button", { name: "保存を再試行" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "保存を再試行" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "設定を保存できませんでした。",
    );
  },
};

export const Saving: Story = {
  args: { savePending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("略称", { exact: true }));
    await expect(
      canvas.getByText("最新の設定をクラウドへ保存しています..."),
    ).toBeVisible();
  },
};
