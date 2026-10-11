import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  createDefaultDistanceTrainingConfig,
  createDefaultKeyboardTrainingConfig,
  getQuestionCountSelectOptions,
  getTimeLimitSecondsSelectOptions,
} from "../../features/training/model/config";
import { getDistanceAnswerChoices } from "../../features/training/model/distance-guest";
import { getIntervalLabel } from "../../features/training/model/interval-notation";
import type {
  IntervalNotationStyle,
  TrainingConfig,
  TrainingMode,
} from "../../features/training/model/types";
import { ButtonLink } from "../ui/navigation-link";
import { AppShell, Notice } from "../ui/primitives";
import {
  reduceDistanceTrainingConfig,
  reduceKeyboardTrainingConfig,
  type SharedTrainingConfigAction,
} from "./training-config-form-state";
import { TrainingConfigPanel } from "./training-config-panel";
import { TrainingProgressHeader } from "./training-page-shell";

interface Args {
  mode: TrainingMode;
  fixed: boolean;
  time: boolean;
  unison: boolean;
  labels: boolean;
  notation: IntervalNotationStyle;
  pending: boolean;
  error: boolean;
  onStart: () => void;
}
function ConfigScreen(args: Args) {
  const [config, setConfig] = useState<TrainingConfig>(() => {
    const value =
      args.mode === "distance"
        ? createDefaultDistanceTrainingConfig()
        : createDefaultKeyboardTrainingConfig();
    return {
      ...value,
      baseNoteMode: args.fixed ? "fixed" : "random",
      fixedBaseNote: args.fixed ? "C#" : null,
      includeUnison: args.unison,
      endCondition: args.time
        ? { type: "time_limit", timeLimitSeconds: 1800 }
        : value.endCondition,
    };
  });
  const onChange = (action: SharedTrainingConfigAction) =>
    setConfig((current) =>
      "intervalGranularity" in current
        ? reduceDistanceTrainingConfig(current, action)
        : reduceKeyboardTrainingConfig(current, action),
    );
  return (
    <AppShell narrow className="ui-train-shell">
      <TrainingProgressHeader
        modeLabel={args.mode === "distance" ? "距離モード" : "鍵盤モード"}
        notice="ゲストでは保存されません。"
        actions={
          <ButtonLink href="/" size="compact" variant="ghost">
            戻る
          </ButtonLink>
        }
      />
      <TrainingConfigPanel
        config={config}
        onChange={onChange}
        onGranularityChange={
          "intervalGranularity" in config
            ? (value) =>
                setConfig((current) =>
                  "intervalGranularity" in current
                    ? reduceDistanceTrainingConfig(current, {
                        type: "set_interval_granularity",
                        value,
                      })
                    : current,
                )
            : undefined
        }
        questionCountOptions={getQuestionCountSelectOptions(
          config.endCondition.type === "question_count"
            ? config.endCondition.questionCount
            : 10,
        )}
        timeLimitOptions={getTimeLimitSecondsSelectOptions(
          config.endCondition.type === "time_limit"
            ? config.endCondition.timeLimitSeconds
            : 180,
        )}
        answerChoiceChips={
          "intervalGranularity" in config
            ? getDistanceAnswerChoices(config).map((value) => ({
                value,
                label: getIntervalLabel(value, args.notation),
              }))
            : undefined
        }
        keyboardLabelsVisible={args.labels}
        onStart={args.onStart}
        startDisabled={args.pending}
      >
        {args.pending ? <Notice>保存済み設定を確認しています...</Notice> : null}
        {args.error ? (
          <Notice tone="error">
            保存済み設定を読み込めませんでした。現在の設定で開始できます。
          </Notice>
        ) : null}
      </TrainingConfigPanel>
    </AppShell>
  );
}
const meta = {
  title: "Train/Configuration",
  component: ConfigScreen,
  args: {
    mode: "distance",
    fixed: false,
    time: false,
    unison: false,
    labels: true,
    notation: "ja",
    pending: false,
    error: false,
    onStart: fn(),
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ConfigScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Distance: Story = {};
export const Keyboard: Story = { args: { mode: "keyboard" } };
export const DistanceFixedTime: Story = {
  args: { fixed: true, time: true, unison: true },
};
export const KeyboardFixedTime: Story = {
  args: { mode: "keyboard", fixed: true, time: true, unison: true },
};
export const DistanceMixedLabels: Story = {
  args: { notation: "mixed", unison: true },
};
export const KeyboardLabelsOff: Story = {
  args: { mode: "keyboard", labels: false },
};
export const BootstrapPending: Story = {
  args: { pending: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "開始" }),
    ).toBeDisabled();
  },
};
export const BootstrapError: Story = { args: { error: true } };
export const DistanceControls: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("spinbutton", { name: "最小半音数" }),
    ).toHaveValue(0);
    await expect(
      canvas.getByRole("checkbox", { name: "同音を含める" }),
    ).not.toBeChecked();
    await userEvent.click(canvas.getByText("制限時間", { exact: true }));
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "制限時間（秒）" }),
      "600",
    );
    await expect(
      canvas.getByRole("combobox", { name: "制限時間（秒）" }),
    ).toHaveValue("600");
    await userEvent.click(canvas.getByText("固定", { exact: true }));
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "固定する基準音" }),
      "F#",
    );
    await expect(
      canvas.getByRole("combobox", { name: "固定する基準音" }),
    ).toHaveValue("F#");
    await expect(
      canvas
        .getByRole("combobox", { name: "固定する基準音" })
        .querySelectorAll("option"),
    ).toHaveLength(12);
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "同音を含める" }),
    );
    await expect(
      canvas.getByRole("checkbox", { name: "同音を含める" }),
    ).toBeChecked();
    await userEvent.click(canvas.getByText("増減あり", { exact: true }));
    await expect(canvas.getByRole("radio", { name: "増減あり" })).toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "開始" }));
    await expect(args.onStart).toHaveBeenCalledOnce();
  },
};
export const KeyboardControls: Story = {
  args: { mode: "keyboard" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "問題数" }),
      "30",
    );
    await expect(canvas.getByRole("combobox", { name: "問題数" })).toHaveValue(
      "30",
    );
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "オクターブを含める" }),
    );
    await expect(
      canvas.getByRole("checkbox", { name: "オクターブを含める" }),
    ).not.toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "開始" }));
    await expect(args.onStart).toHaveBeenCalledOnce();
  },
};
