"use client";

import { useGlobalUserSettings } from "../../features/settings/client/global-user-settings-provider";
import { MAX_MASTER_VOLUME } from "../../features/settings/model/global-user-settings";
import {
  Button,
  Chip,
  Field,
  Notice,
  SectionHeader,
  SegmentedControl,
  Surface,
} from "../ui/primitives";

export function GlobalSettingsSection() {
  const { isAuthenticated, retrySave, saveState, settings, updateSettings } =
    useGlobalUserSettings();

  return (
    <Surface tone="accent" className="ui-settings-primary-surface">
      <SectionHeader
        title="全体設定"
        description="学習に直接関わる設定だけをここで調整します。"
        eyebrow={<Chip tone="brand">まずここ</Chip>}
      />

      <div className="ui-form-layout">
        <div className="ui-form-section">
          <h3 className="ui-form-section__title">再生と効果音</h3>
          <Field
            label="音量"
            hint="基準音と問題音の再生音量です。学習テンポを崩さない範囲で調整します。"
          >
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
            <span className="ui-checkbox-card__content">
              <span className="ui-checkbox-card__title">
                効果音を有効にする
              </span>
              <span className="ui-checkbox-card__description">
                正解 / 惜しい / 不正解の手応えを短く返します。
              </span>
            </span>
          </label>
        </div>

        <div className="ui-form-section">
          <h3 className="ui-form-section__title">表示</h3>
          <Field
            label="音程表記スタイル"
            hint="距離モードの候補表示とフィードバック表示に使います。"
          >
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
                参考表示だけを切り替えます。基準音マーカーは常に残ります。
              </span>
            </span>
          </label>
        </div>
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
          <Notice tone="success" className="ui-settings-save-notice">
            {saveState.updatedAt
              ? "最新の設定はクラウドへ保存済みです。"
              : "クラウド保存の準備ができています。変更すると自動で同期されます。"}
          </Notice>
        )
      ) : (
        <Notice tone="warning" className="ui-settings-save-notice">
          ゲストでは、これらの設定はこのブラウザにのみ保存されます。
        </Notice>
      )}
    </Surface>
  );
}
