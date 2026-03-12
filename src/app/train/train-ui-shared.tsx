import type { SessionFinishReason } from "../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../features/training/server/saveTrainingSession";
import { Button, ButtonLink, Notice } from "../ui/primitives";

export type TrainingPlaybackKind = "question" | "base" | "target";

export function formatRemainingTimeLabel(valueMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatFinishReasonLabel(
  finishReason: SessionFinishReason | null,
): string {
  switch (finishReason) {
    case "target_reached":
      return "目標数に到達";
    case "time_up":
      return "時間切れ";
    case "manual_end":
      return "手動終了";
    default:
      return "不明";
  }
}

export function getPlaybackStatusLabel(playbackKind: TrainingPlaybackKind) {
  switch (playbackKind) {
    case "base":
      return "基準音を再生しています...";
    case "target":
      return "問題音を再生しています...";
    default:
      return "基準音のあとに問題音を再生しています...";
  }
}

export function TrainingResultPersistenceSection(props: {
  isAuthenticated: boolean;
  cannotSaveBecauseNoAnswers: boolean;
  canSaveResult: boolean;
  isSavePending: boolean;
  saveResult: SaveTrainingSessionResult | null;
  onRetrySave?: () => void;
}) {
  if (!props.isAuthenticated) {
    return (
      <div className="ui-stack-md">
        <Notice>ゲスト利用のため、この結果は保存されません。</Notice>
        <p className="ui-subtitle">
          ログインすると、次回以降のセッションから結果保存と統計を使えます。この結果は後から保存されません。
        </p>
        <div className="ui-nav-row">
          <ButtonLink href="/login">今後の保存用にログイン</ButtonLink>
        </div>
      </div>
    );
  }

  if (props.cannotSaveBecauseNoAnswers) {
    return null;
  }

  return (
    <>
      <Notice
        tone={
          props.saveResult?.ok
            ? "success"
            : props.saveResult
              ? "error"
              : props.canSaveResult
                ? "info"
                : "error"
        }
      >
        {props.saveResult?.ok ? (
          <div className="ui-stack-md">
            <div>
              結果を自動保存しました。セッション ID:{" "}
              <code>{props.saveResult.sessionId}</code>
            </div>
            <div className="ui-nav-row">
              <ButtonLink href={`/sessions/${props.saveResult.sessionId}`}>
                セッション詳細を見る
              </ButtonLink>
              <ButtonLink href="/stats">統計を見る</ButtonLink>
            </div>
          </div>
        ) : props.saveResult ? (
          <div className="ui-stack-sm">
            <div>{getSaveFailureMessage(props.saveResult)}</div>
            <div className="ui-muted">
              詳細: {props.saveResult.code} / {props.saveResult.message}
            </div>
          </div>
        ) : props.canSaveResult ? (
          <div>
            {props.isSavePending
              ? "結果を自動保存しています..."
              : "保存の準備をしています..."}
          </div>
        ) : (
          <div>セッション情報が不足しているため保存できません。</div>
        )}
      </Notice>

      {props.saveResult && !props.saveResult.ok && props.canSaveResult ? (
        <div className="ui-action-row">
          <Button
            type="button"
            disabled={props.isSavePending}
            onClick={props.onRetrySave}
            variant="primary"
          >
            {props.isSavePending ? "再試行中..." : "保存を再試行"}
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function PlaybackIcon() {
  return (
    <span className="ui-icon-button__icon" aria-hidden="true">
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
        <title>再生</title>
        <path
          d="M4 7.5a1 1 0 0 1 1.6-.8l7 5a1 1 0 0 1 0 1.6l-7 5A1 1 0 0 1 4 17.5v-10Z"
          fill="currentColor"
        />
        <path
          d="M14.5 5.5a5.5 5.5 0 0 1 0 9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function getSaveFailureMessage(
  result: Extract<SaveTrainingSessionResult, { ok: false }>,
): string {
  if (result.code === "UNAUTHORIZED") {
    return "ログイン状態を確認できませんでした。再度ログインしてからお試しください。";
  }

  if (result.code === "INVALID_INPUT") {
    return "セッション情報が不足しているため、この結果は保存できませんでした。";
  }

  return "結果を保存できませんでした。もう一度お試しください。";
}
