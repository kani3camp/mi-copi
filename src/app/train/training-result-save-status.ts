import type { SaveTrainingSessionResult } from "../../features/training/server/saveTrainingSession";
import { getTrainingResultSaveErrorMessage } from "../../lib/async-action-errors.ts";

export function getTrainingResultSaveStatusViewModel(props: {
  canSaveResult: boolean;
  isSavePending: boolean;
  saveResult: SaveTrainingSessionResult | null;
}) {
  if (props.saveResult?.ok) {
    return {
      tone: "success" as const,
      label: "保存済み" as const,
      title: "結果を自動保存しました。",
      message: "セッション詳細と統計から、今回の結果をすぐ確認できます。",
    };
  }

  if (props.saveResult) {
    return {
      tone: "error" as const,
      label: "保存失敗" as const,
      title: "結果を保存できませんでした。",
      message: getTrainingResultSaveErrorMessage(props.saveResult),
    };
  }

  if (props.canSaveResult) {
    return {
      tone: "info" as const,
      label: "保存中" as const,
      title: props.isSavePending
        ? "結果を保存しています..."
        : "保存を開始しています...",
      message: "この画面のまま待つと、そのまま保存状態が更新されます。",
    };
  }

  return {
    tone: "error" as const,
    label: "保存失敗" as const,
    title: "結果を保存できませんでした。",
    message: "セッション情報が不足しているため保存できません。",
  };
}
