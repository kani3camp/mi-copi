"use client";

import { useGlobalUserSettings } from "../../features/settings/client/global-user-settings-provider";
import { MAX_MASTER_VOLUME } from "../../features/settings/model/global-user-settings";
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
                max={MAX_MASTER_VOLUME}
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
          <Notice tone="info">最新の設定をクラウドへ保存しています...</Notice>
        ) : (
          <Notice tone="info">
            {saveState.updatedAt
              ? "最新の設定はクラウドへ保存済みです。"
              : "クラウド設定を保存する準備ができています。"}
          </Notice>
        )
      ) : (
        <Notice tone="warning">
          ゲストでは、これらの設定はこのブラウザにのみ保存されます。
        </Notice>
      )}
    </Surface>
  );
}
