"use client";
import type { ReactNode } from "react";
import { TRAINING_CONFIG_LIMITS } from "../../features/training/model/config";
import { formatDirectionModeLabel } from "../../features/training/model/interval-notation";
import type {
  IntervalGranularity,
  NoteClass,
  TrainingConfig,
} from "../../features/training/model/types";
import {
  Button,
  Field,
  FieldGrid,
  SectionHeader,
  SegmentedControl,
  Surface,
} from "../ui/primitives";
import type { SharedTrainingConfigAction } from "./training-config-form-state";

const NOTE_CLASS_OPTIONS: NoteClass[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
interface TrainingConfigPanelProps {
  config: TrainingConfig;
  onChange: (action: SharedTrainingConfigAction) => void;
  onGranularityChange?: (value: IntervalGranularity) => void;
  questionCountOptions: number[];
  timeLimitOptions: number[];
  answerChoiceChips?: { value: number; label: string }[];
  keyboardLabelsVisible?: boolean;
  onStart: () => void;
  startDisabled: boolean;
  children?: ReactNode;
}
export function TrainingConfigPanel({
  config,
  onChange,
  onGranularityChange,
  questionCountOptions,
  timeLimitOptions,
  answerChoiceChips,
  keyboardLabelsVisible,
  onStart,
  startDisabled,
  children,
}: TrainingConfigPanelProps) {
  return (
    <Surface className="ui-training-config-panel">
      <SectionHeader title="出題設定" />
      <div className="ui-training-config-layout">
        <TrainingConfigGroup title="終了条件">
          <Field label="終了方法">
            <SegmentedControl
              ariaLabel="終了方法"
              value={config.endCondition.type}
              items={[
                { value: "question_count", label: "問題数" },
                { value: "time_limit", label: "制限時間" },
              ]}
              onChange={(value) =>
                onChange({
                  type: "set_end_condition_type",
                  value,
                })
              }
              stretch
            />
          </Field>
          <FieldGrid>
            <Field
              label={
                config.endCondition.type === "question_count"
                  ? "問題数"
                  : "制限時間（秒）"
              }
            >
              {config.endCondition.type === "question_count" ? (
                <select
                  className="ui-select"
                  aria-label="問題数"
                  onChange={(event) =>
                    onChange({
                      type: "set_question_count",
                      value: event.target.value,
                    })
                  }
                  value={config.endCondition.questionCount}
                >
                  {questionCountOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} 問
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  className="ui-select"
                  aria-label="制限時間（秒）"
                  onChange={(event) =>
                    onChange({
                      type: "set_time_limit_seconds",
                      value: event.target.value,
                    })
                  }
                  value={config.endCondition.timeLimitSeconds}
                >
                  {timeLimitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} 秒
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </FieldGrid>
        </TrainingConfigGroup>

        <TrainingConfigGroup title="出題範囲">
          <FieldGrid>
            <Field label="最小半音数">
              <input
                className="ui-input"
                aria-label="最小半音数"
                max={TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max}
                min={TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.min}
                onChange={(event) =>
                  onChange({
                    type: "set_min_semitone",
                    value: event.target.value,
                  })
                }
                type="number"
                value={config.intervalRange.minSemitone}
              />
            </Field>
            <Field label="最大半音数">
              <input
                className="ui-input"
                aria-label="最大半音数"
                max={TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.max}
                min={Math.max(
                  TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.min,
                  config.intervalRange.minSemitone,
                )}
                onChange={(event) =>
                  onChange({
                    type: "set_max_semitone",
                    value: event.target.value,
                  })
                }
                type="number"
                value={config.intervalRange.maxSemitone}
              />
            </Field>
            <Field label="出題方向">
              <SegmentedControl
                ariaLabel="出題方向"
                value={config.directionMode}
                items={[
                  {
                    value: "mixed",
                    label: formatDirectionModeLabel("mixed"),
                  },
                  {
                    value: "up_only",
                    label: formatDirectionModeLabel("up_only"),
                  },
                ]}
                onChange={(value) =>
                  onChange({
                    type: "set_direction_mode",
                    value,
                  })
                }
                stretch
              />
            </Field>
            <Field label="基準音モード">
              <SegmentedControl
                ariaLabel="基準音モード"
                value={config.baseNoteMode}
                items={[
                  { value: "random", label: "ランダム" },
                  { value: "fixed", label: "固定" },
                ]}
                onChange={(value) =>
                  onChange({
                    type: "set_base_note_mode",
                    value,
                  })
                }
                stretch
              />
            </Field>
          </FieldGrid>

          {config.baseNoteMode === "fixed" ? (
            <Field label="固定する基準音">
              <select
                className="ui-select"
                aria-label="固定する基準音"
                onChange={(event) =>
                  onChange({
                    type: "set_fixed_base_note",
                    value: event.target.value,
                  })
                }
                value={config.fixedBaseNote ?? "C"}
              >
                {NOTE_CLASS_OPTIONS.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </TrainingConfigGroup>

        <TrainingConfigGroup title="回答スタイル">
          <div className="ui-train-config-toggle-grid">
            <label className="ui-checkbox-card">
              <input
                checked={config.includeUnison}
                onChange={(event) =>
                  onChange({
                    type: "toggle_include_unison",
                    checked: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>同音を含める</span>
            </label>
            <label className="ui-checkbox-card">
              <input
                checked={config.includeOctave}
                onChange={(event) =>
                  onChange({
                    type: "toggle_include_octave",
                    checked: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>オクターブを含める</span>
            </label>
          </div>
          {"intervalGranularity" in config && onGranularityChange ? (
            <Field label="音程表記の粒度">
              <SegmentedControl
                ariaLabel="音程表記の粒度"
                value={config.intervalGranularity}
                items={[
                  { value: "simple", label: "シンプル" },
                  { value: "aug_dim", label: "増減あり" },
                ]}
                onChange={onGranularityChange}
                stretch
              />
            </Field>
          ) : null}
          {answerChoiceChips ? (
            <div className="ui-form-section__preview">
              <span className="ui-form-inline-note">現在の候補</span>
              <div className="ui-form-chip-list">
                {answerChoiceChips.map((choice) => (
                  <span key={choice.value}>{choice.label}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="ui-form-inline-note">
              回答候補は常に12音です。鍵盤ラベルは
              {keyboardLabelsVisible ? "表示中" : "非表示"}
              です。表示切替は設定画面で行えます。
            </p>
          )}
        </TrainingConfigGroup>
      </div>

      {children}
      <div className="ui-training-config-start">
        <Button
          block
          disabled={startDisabled}
          onClick={onStart}
          type="button"
          variant="primary"
        >
          開始
        </Button>
      </div>
    </Surface>
  );
}
function TrainingConfigGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ui-training-config-group">
      <h3 className="sr-only">{title}</h3>
      {children}
    </section>
  );
}
