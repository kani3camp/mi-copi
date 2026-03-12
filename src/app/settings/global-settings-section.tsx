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
        description="音量、効果音、音程表記、鍵盤ラベル表示をここで変更できます。"
      />

      <Field label="音量">
        <div style={{ display: "grid", gap: "6px" }}>
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
          <span className="ui-muted">{settings.masterVolume}%</span>
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
        <span>効果音</span>
      </label>

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
        <span>鍵盤の音名ラベル</span>
      </label>

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
          <p className="ui-subtitle">
            {saveState.updatedAt
              ? `${formatDateTimeLabel(saveState.updatedAt)} にクラウドへ保存しました。`
              : "クラウド設定を保存する準備ができています。"}
          </p>
        )
      ) : (
        <p className="ui-subtitle">
          ゲストでは、これらの設定はこのブラウザにのみ保存されます。
        </p>
      )}
    </Surface>
  );
}
