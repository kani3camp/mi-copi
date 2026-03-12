"use client";

import { useGlobalUserSettings } from "../../features/settings/client/global-user-settings-provider";
import { formatDateTimeLabel } from "../../features/training/model/format";
import {
  buttonStyle,
  cardStyle,
  noticeStyle,
  sectionTitleStyle,
  subtleTextStyle,
} from "../ui/polish";

const fieldStyle = {
  display: "grid",
  gap: "8px",
};

const toggleStyle = {
  ...fieldStyle,
  gridAutoFlow: "column" as const,
  justifyContent: "start",
  alignItems: "center",
};

export function GlobalSettingsSection() {
  const { isAuthenticated, retrySave, saveState, settings, updateSettings } =
    useGlobalUserSettings();

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>全体設定</h2>
      <p style={subtleTextStyle}>
        音量、効果音、音程表記、鍵盤ラベル表示をここで変更できます。
      </p>

      <label style={fieldStyle}>
        <span>音量</span>
        <div style={{ display: "grid", gap: "6px" }}>
          <input
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
          <span style={subtleTextStyle}>{settings.masterVolume}%</span>
        </div>
      </label>

      <label style={toggleStyle}>
        <input
          type="checkbox"
          checked={settings.soundEffectsEnabled}
          onChange={(event) =>
            updateSettings({ soundEffectsEnabled: event.target.checked })
          }
        />
        <span>効果音</span>
      </label>

      <label style={fieldStyle}>
        <span>音程表記スタイル</span>
        <select
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
      </label>

      <label style={toggleStyle}>
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
          <div style={noticeStyle("error")}>
            <div style={{ display: "grid", gap: "10px" }}>
              <div>{saveState.message ?? "Failed to save settings."}</div>
              <div>
                <button type="button" onClick={retrySave} style={buttonStyle()}>
                  保存を再試行
                </button>
              </div>
            </div>
          </div>
        ) : saveState.status === "saving" ? (
          <div style={noticeStyle("info")}>最新の設定を保存しています...</div>
        ) : (
          <p style={subtleTextStyle}>
            {saveState.updatedAt
              ? `${formatDateTimeLabel(saveState.updatedAt)} にクラウドへ保存しました。`
              : "クラウド設定を保存する準備ができています。"}
          </p>
        )
      ) : (
        <p style={subtleTextStyle}>
          ゲストでは、これらの設定はこのブラウザにのみ保存されます。
        </p>
      )}
    </section>
  );
}
