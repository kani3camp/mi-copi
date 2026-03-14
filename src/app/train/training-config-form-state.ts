"use client";

import {
  clampIntervalMaxSemitone,
  clampIntervalMinSemitone,
  clampQuestionCount,
  clampTimeLimitSeconds,
  createDefaultQuestionCountEndCondition,
  createDefaultTimeLimitEndCondition,
} from "../../features/training/model/config.ts";
import type {
  DistanceTrainingConfig,
  IntervalGranularity,
  KeyboardTrainingConfig,
  NoteClass,
  TrainingConfig,
} from "../../features/training/model/types.ts";

export type SharedTrainingConfigAction =
  | { type: "set_end_condition_type"; value: unknown }
  | { type: "set_question_count"; value: unknown }
  | { type: "set_time_limit_seconds"; value: unknown }
  | { type: "set_min_semitone"; value: unknown }
  | { type: "set_max_semitone"; value: unknown }
  | { type: "set_direction_mode"; value: unknown }
  | { type: "set_base_note_mode"; value: unknown }
  | { type: "set_fixed_base_note"; value: unknown }
  | { type: "toggle_include_unison"; checked: boolean }
  | { type: "toggle_include_octave"; checked: boolean };

export type DistanceTrainingConfigAction =
  | SharedTrainingConfigAction
  | {
      type: "set_interval_granularity";
      value: IntervalGranularity;
    }
  | { type: "replace_config"; config: DistanceTrainingConfig };

export type KeyboardTrainingConfigAction =
  | SharedTrainingConfigAction
  | { type: "replace_config"; config: KeyboardTrainingConfig };

export function reduceDistanceTrainingConfig(
  current: DistanceTrainingConfig,
  action: DistanceTrainingConfigAction,
): DistanceTrainingConfig {
  if (action.type === "replace_config") {
    return action.config;
  }

  if (action.type === "set_interval_granularity") {
    return {
      ...current,
      intervalGranularity: action.value,
    };
  }

  return reduceSharedTrainingConfig(current, action);
}

export function reduceKeyboardTrainingConfig(
  current: KeyboardTrainingConfig,
  action: KeyboardTrainingConfigAction,
): KeyboardTrainingConfig {
  if (action.type === "replace_config") {
    return action.config;
  }

  return reduceSharedTrainingConfig(current, action);
}

function reduceSharedTrainingConfig<TConfig extends TrainingConfig>(
  current: TConfig,
  action: SharedTrainingConfigAction,
): TConfig {
  switch (action.type) {
    case "set_end_condition_type":
      return {
        ...current,
        endCondition:
          action.value === "time_limit"
            ? createDefaultTimeLimitEndCondition()
            : createDefaultQuestionCountEndCondition(),
      };
    case "set_question_count":
      return {
        ...current,
        endCondition: {
          type: "question_count",
          questionCount: clampQuestionCount(action.value),
        },
      };
    case "set_time_limit_seconds":
      return {
        ...current,
        endCondition: {
          type: "time_limit",
          timeLimitSeconds: clampTimeLimitSeconds(action.value),
        },
      };
    case "set_min_semitone": {
      const minSemitone = clampIntervalMinSemitone(action.value);

      return {
        ...current,
        intervalRange: {
          minSemitone,
          maxSemitone: clampIntervalMaxSemitone(
            current.intervalRange.maxSemitone,
            minSemitone,
          ),
        },
      };
    }
    case "set_max_semitone":
      return {
        ...current,
        intervalRange: {
          ...current.intervalRange,
          maxSemitone: clampIntervalMaxSemitone(
            action.value,
            current.intervalRange.minSemitone,
          ),
        },
      };
    case "set_direction_mode":
      return {
        ...current,
        directionMode: action.value === "up_only" ? "up_only" : "mixed",
      };
    case "set_base_note_mode":
      return {
        ...current,
        baseNoteMode: action.value === "fixed" ? "fixed" : "random",
        fixedBaseNote:
          action.value === "fixed" ? (current.fixedBaseNote ?? "C") : null,
      };
    case "set_fixed_base_note":
      return {
        ...current,
        fixedBaseNote: isNoteClass(action.value) ? action.value : "C",
      };
    case "toggle_include_unison":
      return {
        ...current,
        includeUnison: action.checked,
      };
    case "toggle_include_octave":
      return {
        ...current,
        includeOctave: action.checked,
      };
    default:
      return current;
  }
}

function isNoteClass(value: unknown): value is NoteClass {
  return (
    value === "C" ||
    value === "C#" ||
    value === "D" ||
    value === "D#" ||
    value === "E" ||
    value === "F" ||
    value === "F#" ||
    value === "G" ||
    value === "G#" ||
    value === "A" ||
    value === "A#" ||
    value === "B"
  );
}
