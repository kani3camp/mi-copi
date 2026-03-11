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
      <h2 style={sectionTitleStyle}>Global settings</h2>
      <p style={subtleTextStyle}>
        音量、効果音、音程表記、鍵盤ラベル表示をここで変更できます。
      </p>

      <label style={fieldStyle}>
        <span>Master volume</span>
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
        <span>Sound effects</span>
      </label>

      <label style={fieldStyle}>
        <span>Interval notation style</span>
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
          <option value="ja">Japanese</option>
          <option value="abbr">Abbreviation</option>
          <option value="mixed">Mixed</option>
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
        <span>Keyboard note labels</span>
      </label>

      {isAuthenticated ? (
        saveState.status === "error" ? (
          <div style={noticeStyle("error")}>
            <div style={{ display: "grid", gap: "10px" }}>
              <div>{saveState.message ?? "Failed to save settings."}</div>
              <div>
                <button type="button" onClick={retrySave} style={buttonStyle()}>
                  Retry save
                </button>
              </div>
            </div>
          </div>
        ) : saveState.status === "saving" ? (
          <div style={noticeStyle("info")}>Saving latest settings...</div>
        ) : (
          <p style={subtleTextStyle}>
            {saveState.updatedAt
              ? `Cloud saved at ${formatDateTimeLabel(saveState.updatedAt)}.`
              : "Cloud settings are ready to save."}
          </p>
        )
      ) : (
        <p style={subtleTextStyle}>
          Guest mode keeps these settings in this browser only.
        </p>
      )}
    </section>
  );
}
