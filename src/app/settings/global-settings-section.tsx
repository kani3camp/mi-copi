"use client";

import { useId } from "react";
import { useGlobalUserSettings } from "../../features/settings/client/global-user-settings-provider";
import { MAX_MASTER_VOLUME } from "../../features/settings/model/global-user-settings";
import { MetricValue } from "../ui/metric-value";
import {
  Button,
  Field,
  Notice,
  SectionHeader,
  SegmentedControl,
  Surface,
} from "../ui/primitives";

export function GlobalSettingsSection() {
  const volumeId = useId();
  const { isAuthenticated, retrySave, saveState, settings, updateSettings } =
    useGlobalUserSettings();

  return (
    <Surface tone="accent" className="ui-settings-primary-surface">
      <SectionHeader title="全体設定" />

      <div className="ui-settings-controls">
        <Field label={<label htmlFor={volumeId}>音量</label>}>
          <div className="ui-stack-sm">
            <input
              className="ui-range"
              id={volumeId}
              type="range"
              min={0}
              max={MAX_MASTER_VOLUME}
              value={settings.masterVolume}
              onChange={(event) =>
                updateSettings({
                  masterVolume: Number.parseInt(event.target.value, 10),
                })
              }
            />
            <span className="ui-mini-note">
              <MetricValue value={settings.masterVolume} unit="%" />
            </span>
          </div>
        </Field>
        <label className="ui-checkbox-card">
          <input
            type="checkbox"
            checked={settings.soundEffectsEnabled}
            onChange={(event) =>
              updateSettings({ soundEffectsEnabled: event.target.checked })
            }
          />
          <span className="ui-checkbox-card__content">
            <span className="ui-checkbox-card__title">効果音を有効にする</span>
          </span>
        </label>

        <Field label="音程表記スタイル">
          <SegmentedControl
            ariaLabel="音程表記スタイル"
            value={settings.intervalNotationStyle}
            onChange={(value) =>
              updateSettings({
                intervalNotationStyle: value,
              })
            }
            stretch
            items={[
              { value: "ja", label: "日本語" },
              { value: "abbr", label: "略称" },
              { value: "mixed", label: "混在" },
            ]}
          />
        </Field>
        <label className="ui-checkbox-card">
          <input
            type="checkbox"
            checked={settings.keyboardNoteLabelsVisible}
            onChange={(event) =>
              updateSettings({
                keyboardNoteLabelsVisible: event.target.checked,
              })
            }
          />
          <span className="ui-checkbox-card__content">
            <span className="ui-checkbox-card__title">
              鍵盤の音名ラベルを表示する
            </span>
            <span className="ui-checkbox-card__description">
              基準音マーカーは常に表示します。
            </span>
          </span>
        </label>
      </div>

      {isAuthenticated ? (
        saveState.status === "error" ? (
          <Notice tone="error" className="ui-settings-save-notice">
            <div className="ui-stack-md">
              <div>
                {saveState.message ??
                  "設定を保存できませんでした。接続状態を確認して再試行してください。"}
              </div>
              <div>
                <Button type="button" onClick={retrySave} variant="secondary">
                  保存を再試行
                </Button>
              </div>
            </div>
          </Notice>
        ) : saveState.status === "saving" ? (
          <Notice tone="info" className="ui-settings-save-notice">
            最新の設定をクラウドへ保存しています...
          </Notice>
        ) : (
          <output className="ui-settings-save-status">
            {saveState.updatedAt
              ? "最新の設定はクラウドへ保存済みです。"
              : "クラウド保存の準備ができています。変更すると自動で同期されます。"}
          </output>
        )
      ) : (
        <output className="ui-settings-save-status">
          ゲストでは、これらの設定はこのブラウザにのみ保存されます。
        </output>
      )}
    </Surface>
  );
}
