import {
  formatDateLabel,
  formatScoreLabel,
} from "../../features/training/model/format.ts";
import type { TrainingStats } from "../../features/training/server/getTrainingStats.ts";
import type { ChartPoint, ChartTone } from "./stats-charts";

export type StatsTrendMode = "overall" | "distance" | "keyboard";

export interface StatsTrendOption {
  id: StatsTrendMode;
  label: string;
  tone: ChartTone;
  points: ChartPoint[];
}

const SCORE_TREND_META: Record<
  StatsTrendMode,
  {
    label: string;
    tone: ChartTone;
    assistiveLabel: string;
  }
> = {
  overall: {
    label: "全体",
    tone: "brand",
    assistiveLabel: "全体",
  },
  distance: {
    label: "距離",
    tone: "teal",
    assistiveLabel: "距離モード",
  },
  keyboard: {
    label: "鍵盤",
    tone: "blue",
    assistiveLabel: "鍵盤モード",
  },
};

export function createScoreTrendOptions(
  scoreTrends: TrainingStats["scoreTrends"],
): StatsTrendOption[] {
  return (["overall", "distance", "keyboard"] as const).map((id) => {
    const meta = SCORE_TREND_META[id];

    return {
      id,
      label: meta.label,
      tone: meta.tone,
      points: scoreTrends[id].map((trend) => ({
        key: `${id}-${trend.date}`,
        label: formatCompactDateLabel(trend.date),
        assistiveLabel: `${formatDateLabel(trend.date)} ${meta.assistiveLabel} 平均スコア ${formatScoreLabel(trend.averageScore)} / ${trend.questionCount} 問`,
        value: trend.averageScore,
      })),
    };
  });
}

export function formatCompactDateLabel(value: string): string {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${month}/${day}`;
}

export function getCompactIntervalChartLabel(semitones: number): string {
  const labels: Record<number, string> = {
    0: "完1",
    1: "短2",
    2: "長2",
    3: "短3",
    4: "長3",
    5: "完4",
    6: "増4",
    7: "完5",
    8: "短6",
    9: "長6",
    10: "短7",
    11: "長7",
    12: "完8",
  };

  return labels[semitones] ?? `${semitones}半`;
}
