import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import {
  FeedbackStatusChip,
  PlaybackButtonPair,
} from "../train/train-ui-shared";
import {
  AppShell,
  Button,
  Field,
  SummaryBlock,
  SummaryStat,
  Surface,
} from "./primitives";

const meta = {
  title: "UI/Design System v2",
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

export const PrimaryAndSecondaryButtons: Story = {
  render: () => (
    <Surface>
      <div className="ui-action-row">
        <Button type="button" variant="primary">
          トレーニングを始める
        </Button>
        <Button type="button" variant="secondary">
          設定を見る
        </Button>
      </div>
    </Surface>
  ),
};

export const AudioButtons: Story = {
  render: () => (
    <Surface>
      <PlaybackButtonPair
        isPlaybackLocked={false}
        onReplayBase={() => undefined}
        onReplayTarget={() => undefined}
      />
      <PlaybackButtonPair
        isPlaybackLocked
        onReplayBase={() => undefined}
        onReplayTarget={() => undefined}
      />
    </Surface>
  ),
};

export const FeedbackStatuses: Story = {
  render: () => (
    <Surface>
      <div className="ui-action-row">
        <FeedbackStatusChip errorSemitones={0} />
        <FeedbackStatusChip errorSemitones={1} />
        <FeedbackStatusChip errorSemitones={4} />
      </div>
    </Surface>
  ),
};

export const MetricAndScore: Story = {
  render: () => (
    <Surface>
      <SummaryBlock>
        <SummaryStat label="スコア" value="1,284" emphasis="primary" />
        <SummaryStat label="平均誤差" value="0.7 半音" />
        <SummaryStat label="回答時間" value="1.82 秒" />
      </SummaryBlock>
    </Surface>
  ),
};

function FormControls() {
  const [name, setName] = useState("C4");
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(72);

  return (
    <Surface>
      <Field label="固定基準音" hint="入力・トグル・スライダーのv2状態確認">
        <input
          className="ui-input"
          aria-label="固定基準音"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <label className="ui-checkbox-card">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        <span className="ui-checkbox-card__content">
          <span className="ui-checkbox-card__title">効果音を有効にする</span>
          <span className="ui-checkbox-card__description">
            色だけでなくスイッチ位置でも状態を識別できます。
          </span>
        </span>
      </label>
      <Field label="音量" hint={`${volume}%`}>
        <input
          className="ui-range"
          type="range"
          min={0}
          max={100}
          value={volume}
          aria-label="音量"
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </Field>
    </Surface>
  );
}

export const InputToggleSlider: Story = {
  render: () => <FormControls />,
};
