"use client";

import { useGlobalUserSettings } from "../../features/settings/client/global-user-settings-provider";
import { formatDateTimeLabel } from "../../features/training/model/format";
import {
  Button,
  Field,
  Notice,
  SectionHeader,
  Surface,
} from "../ui/primitives";

export function GlobalSettingsSection() {
  const { isAuthenticated, retrySave, saveState, settings, updateSettings } =
    useGlobalUserSettings();

  return (
    <Surface tone="accent">
      <SectionHeader
        title="全体設定"
        description="学習に直接関わる設定だけをここで調整します。"
      />

      <div className="ui-form-layout">
        <div className="ui-form-section">
          <h3 className="ui-form-section__title">再生と効果音</h3>
          <Field label="音量">
            <div className="ui-stack-sm">
              <input
                className="ui-range"
                type="range"
                min={0}
                max={100}
                value={settings.masterVolume}
                onChange={(event) =>
                  updateSettings({
                    masterVolume: Number.parseInt(event.target.value, 10),
                  })
                }
              />
              <span className="ui-mini-note">{settings.masterVolume}%</span>
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
            <span>効果音を有効にする</span>
          </label>
        </div>

        <div className="ui-form-section">
          <h3 className="ui-form-section__title">表示</h3>
          <Field label="音程表記スタイル">
            <select
              className="ui-select"
              value={settings.intervalNotationStyle}
              onChange={(event) =>
                updateSettings({
                  intervalNotationStyle: event.target.value as
                    | "ja"
                    | "abbr"
                    | "mixed",
                })
              }
            >
              <option value="ja">日本語</option>
              <option value="abbr">略称</option>
              <option value="mixed">混在</option>
            </select>
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
            <span>鍵盤の音名ラベルを表示する</span>
          </label>
        </div>
      </div>

      {isAuthenticated ? (
        saveState.status === "error" ? (
          <Notice tone="error">
            <div className="ui-stack-md">
              <div>{saveState.message ?? "Failed to save settings."}</div>
              <div>
                <Button type="button" onClick={retrySave}>
                  保存を再試行
                </Button>
              </div>
            </div>
          </Notice>
        ) : saveState.status === "saving" ? (
          <Notice>最新の設定を保存しています...</Notice>
        ) : (
          <p className="ui-mini-note">
            {saveState.updatedAt
              ? `${formatDateTimeLabel(saveState.updatedAt)} にクラウドへ保存しました。`
              : "クラウド設定を保存する準備ができています。"}
          </p>
        )
      ) : (
        <p className="ui-mini-note">
          ゲストでは、これらの設定はこのブラウザにのみ保存されます。
        </p>
      )}
    </Surface>
  );
}
