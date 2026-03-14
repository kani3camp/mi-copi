import type { SessionPhase } from "../../features/training/model/types.ts";
import type { SaveTrainingSessionResult } from "../../features/training/server/saveTrainingSession.ts";

export function formatTrainingPhaseLabel(phase: SessionPhase): string {
  switch (phase) {
    case "config":
      return "設定";
    case "preparing":
      return "準備中";
    case "playing":
      return "再生中";
    case "answering":
      return "回答中";
    case "feedback":
      return "フィードバック";
    case "result":
      return "結果";
  }
}

export function buildTrainingHeaderMeta(props: {
  cannotSaveBecauseNoAnswers: boolean;
  isAuthenticated: boolean;
  phase: SessionPhase;
  remainingTimeMs: number | null;
  saveResult: SaveTrainingSessionResult | null;
}): string | null {
  if (props.phase === "result") {
    if (props.saveResult?.ok) {
      return "保存済み";
    }

    if (props.cannotSaveBecauseNoAnswers) {
      return props.isAuthenticated ? "保存対象外" : "ゲスト";
    }

    return props.isAuthenticated ? "保存待機" : "ゲスト";
  }

  if (props.remainingTimeMs !== null) {
    return formatRemainingTimeLabel(props.remainingTimeMs);
  }

  return null;
}

export function buildTrainingHeaderNotice(props: {
  audioError: string | null;
  isAuthenticated: boolean;
}): string {
  if (props.audioError) {
    return props.audioError;
  }

  return props.isAuthenticated
    ? "結果画面では自動保存されます。"
    : "ゲストでは保存されません。";
}

function formatRemainingTimeLabel(valueMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
