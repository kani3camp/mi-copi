import {
  formatDurationSecondsLabel,
  formatTrainingModeLabel,
} from "../../../features/training/model/format.ts";
import { formatDirectionModeLabel } from "../../../features/training/model/interval-notation.ts";
import type { TrainingSessionDetail } from "../../../features/training/server/getTrainingSessionDetail.ts";

export interface SessionDetailConfigGroup {
  title: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
}

export function createSessionDetailConfigGroups(
  detail: TrainingSessionDetail,
): SessionDetailConfigGroup[] {
  const config = detail.configSnapshot;

  return [
    {
      title: "終了条件",
      rows: [
        {
          label: "モード",
          value: formatTrainingModeLabel(config.mode),
        },
        {
          label: "終了条件",
          value:
            config.endCondition.type === "question_count"
              ? `${config.endCondition.questionCount} 問`
              : formatDurationSecondsLabel(
                  config.endCondition.timeLimitSeconds,
                ),
        },
      ],
    },
    {
      title: "出題範囲",
      rows: [
        {
          label: "音程範囲",
          value: `${config.intervalRange.minSemitone} - ${config.intervalRange.maxSemitone}`,
        },
        {
          label: "出題方向",
          value: formatDirectionModeLabel(config.directionMode),
        },
        {
          label: "基準音モード",
          value: config.baseNoteMode === "fixed" ? "固定" : "ランダム",
        },
        {
          label: "固定する基準音",
          value: config.fixedBaseNote ?? "なし",
        },
      ],
    },
    {
      title: "回答スタイル",
      rows: [
        {
          label: "同音を含める",
          value: config.includeUnison ? "はい" : "いいえ",
        },
        {
          label: "オクターブを含める",
          value: config.includeOctave ? "はい" : "いいえ",
        },
        config.mode === "distance"
          ? {
              label: "音程表記の粒度",
              value:
                config.intervalGranularity === "simple"
                  ? "シンプル"
                  : "増減あり",
            }
          : {
              label: "鍵盤の回答形式",
              value: "音名",
            },
      ],
    },
  ];
}

export function getSessionDetailEvaluation(result: {
  isCorrect: boolean;
  errorSemitones: number;
}): { tone: "success" | "warning" | "error"; label: string } {
  if (result.isCorrect) {
    return { tone: "success", label: "正解" };
  }

  if (Math.abs(result.errorSemitones) === 1) {
    return { tone: "warning", label: "惜しい" };
  }

  return { tone: "error", label: "不正解" };
}
