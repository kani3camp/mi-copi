import type { ReactNode } from "react";

import type { SessionFinishReason } from "../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../features/training/server/saveTrainingSession";
import { getTrainingResultSaveErrorMessage } from "../../lib/async-action-errors";
import { ButtonLink } from "../ui/navigation-link";
import { Button, Chip, Notice } from "../ui/primitives";
import { getDistanceFeedbackStatus } from "./distance-feedback-status";

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

export function PlaybackButtonPair(props: {
  isPlaybackLocked: boolean;
  onReplayBase: () => void;
  onReplayTarget: () => void;
}) {
  return (
    <div className="ui-playback-pair">
      <PlaybackButton
        label="基準音"
        disabled={props.isPlaybackLocked}
        onClick={props.onReplayBase}
      />
      <PlaybackButton
        label="問題音"
        disabled={props.isPlaybackLocked}
        onClick={props.onReplayTarget}
      />
    </div>
  );
}

function PlaybackButton(props: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className="ui-playback-button"
      aria-label={`${props.label}を再生`}
    >
      <span className="ui-playback-button__icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
          <title>{props.label}</title>
          <path
            d="M4 7.5a1 1 0 0 1 1.6-.8l7 5a1 1 0 0 1 0 1.6l-7 5A1 1 0 0 1 4 17.5v-10Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="ui-playback-button__label">{props.label}</span>
      <span
        className="ui-playback-button__state"
        data-active="false"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </span>
    </Button>
  );
}

export function MiniStatRow(props: {
  items: Array<{
    id: string;
    label: ReactNode;
    value: ReactNode;
    tone?: "neutral" | "teal" | "amber" | "coral" | "blue";
  }>;
}) {
  return (
    <div className="ui-mini-stat-row">
      {props.items.map((item) => (
        <div
          key={item.id}
          className="ui-mini-stat"
          data-tone={item.tone ?? "neutral"}
        >
          <span className="ui-mini-stat__label">{item.label}</span>
          <strong className="ui-mini-stat__value">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function FeedbackStatusChip(props: {
  errorSemitones: number;
  isCorrect: boolean;
}) {
  const status = getDistanceFeedbackStatus({
    isCorrect: props.isCorrect,
    errorSemitones: props.errorSemitones,
  });

  return (
    <div className="ui-feedback-status">
      <Chip tone={status.tone}>{status.label}</Chip>
    </div>
  );
}

export { DistanceFeedbackDiagram } from "./distance-feedback-diagram-svg";

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
        <Notice tone="warning">
          ゲスト利用のため、この結果は保存されません。
        </Notice>
        <p className="ui-subtitle">
          ログインすると、次回以降のセッションから結果保存と統計を使えます。この結果は後から保存されません。
        </p>
        <div className="ui-nav-row">
          <ButtonLink
            href="/login"
            pendingLabel="ログイン画面を開いています..."
          >
            今後の保存用にログイン
          </ButtonLink>
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
            <div>結果を自動保存しました。</div>
            <div className="ui-nav-row">
              <ButtonLink
                href={`/sessions/${props.saveResult.sessionId}`}
                pendingLabel="セッション詳細を開いています..."
              >
                セッション詳細を見る
              </ButtonLink>
              <ButtonLink href="/stats" pendingLabel="統計を開いています...">
                統計を見る
              </ButtonLink>
            </div>
          </div>
        ) : props.saveResult ? (
          <div>{getSaveFailureMessage(props.saveResult)}</div>
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
            pending={props.isSavePending}
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

function getSaveFailureMessage(
  result: Extract<SaveTrainingSessionResult, { ok: false }>,
): string {
  return getTrainingResultSaveErrorMessage(result);
}
