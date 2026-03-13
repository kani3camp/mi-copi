import type { ReactNode } from "react";

import type {
  QuestionDirection,
  SessionFinishReason,
} from "../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../features/training/server/saveTrainingSession";
import { ButtonLink } from "../ui/navigation-link";
import { Button, Chip, Notice } from "../ui/primitives";
import { buildDistanceFeedbackDiagramAnnotations } from "./distance-feedback-annotations";
import { buildDistanceFeedbackDiagramArrows } from "./distance-feedback-arrows";
import {
  buildDistanceFeedbackDiagramSteps,
  DISTANCE_FEEDBACK_SCALE_MAX_SEMITONES,
} from "./distance-feedback-diagram";
import { getDistanceFeedbackStatus } from "./distance-feedback-status";

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
      return "基準音を再生中";
    case "target":
      return "問題音を再生中";
    default:
      return "基準音のあとに問題音を再生中";
  }
}

export function PlaybackButtonPair(props: {
  isPlaybackLocked: boolean;
  playbackKind: TrainingPlaybackKind;
  onReplayBase: () => void;
  onReplayTarget: () => void;
}) {
  return (
    <div className="ui-playback-pair">
      <PlaybackButton
        label="基準音"
        isActive={
          props.playbackKind === "base" || props.playbackKind === "question"
        }
        disabled={props.isPlaybackLocked}
        onClick={props.onReplayBase}
      />
      <PlaybackButton
        label="問題音"
        isActive={props.playbackKind === "target"}
        disabled={props.isPlaybackLocked}
        onClick={props.onReplayTarget}
      />
    </div>
  );
}

function PlaybackButton(props: {
  label: string;
  isActive: boolean;
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
        data-active={props.isActive ? "true" : "false"}
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
    label: ReactNode;
    value: ReactNode;
    tone?: "neutral" | "teal" | "amber" | "coral" | "blue";
  }>;
}) {
  return (
    <div className="ui-mini-stat-row">
      {props.items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
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

export function DistanceFeedbackDiagram(props: {
  direction: QuestionDirection;
  correctSemitones: number;
  answeredSemitones: number;
}) {
  const steps = buildDistanceFeedbackDiagramSteps({
    direction: props.direction,
    correctSemitones: props.correctSemitones,
    answeredSemitones: props.answeredSemitones,
  });
  const annotations = buildDistanceFeedbackDiagramAnnotations({
    correctSemitones: props.correctSemitones,
    answeredSemitones: props.answeredSemitones,
  });
  const clampedCorrect = Math.min(
    DISTANCE_FEEDBACK_SCALE_MAX_SEMITONES,
    Math.abs(props.correctSemitones),
  );
  const clampedAnswered = Math.min(
    DISTANCE_FEEDBACK_SCALE_MAX_SEMITONES,
    Math.abs(props.answeredSemitones),
  );
  const baseIndex = steps.findIndex((step) => step.distance === 0);
  const correctIndex = steps.findIndex(
    (step) => step.distance === clampedCorrect,
  );
  const answeredIndex = steps.findIndex(
    (step) => step.distance === clampedAnswered,
  );
  const arrows = buildDistanceFeedbackDiagramArrows({
    stepCount: steps.length,
    correctIndex,
    answeredIndex,
    baseIndex,
  });
  const columnTemplate = `repeat(${steps.length}, minmax(0, 1fr))`;

  return (
    <div
      className="ui-distance-diagram"
      data-direction={props.direction}
      role="img"
      aria-label={`距離フィードバック: 0 が基準音、${
        props.direction === "down" ? "下方向" : "上方向"
      }`}
    >
      <div className="ui-distance-diagram__viewport">
        <div
          className="ui-distance-diagram__scale"
          style={{
            gridTemplateColumns: columnTemplate,
          }}
        >
          <div
            className="ui-distance-diagram__arrow-layer ui-distance-diagram__arrow-layer--over-markers"
            style={{
              gridTemplateColumns: columnTemplate,
            }}
            aria-hidden="true"
          >
            {arrows.map((arrow) => (
              <div
                key={`${arrow.tone}-${arrow.lane}-${arrow.columnStart}-${arrow.columnEnd}`}
                className="ui-distance-diagram__arrow"
                data-tone={arrow.tone}
                data-lane={arrow.lane}
                style={{
                  gridColumn: `${arrow.columnStart} / ${arrow.columnEnd}`,
                }}
              >
                <svg
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                  className="ui-distance-diagram__arrow-svg"
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id={`distance-arrowhead-${arrow.tone}`}
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M0,0 L8,4 L0,8 Z" />
                    </marker>
                  </defs>
                  <line
                    x1={arrow.direction === "forward" ? "2" : "98"}
                    y1="6"
                    x2={arrow.direction === "forward" ? "98" : "2"}
                    y2="6"
                    className="ui-distance-diagram__arrow-line"
                    data-tone={arrow.tone}
                    markerEnd={`url(#distance-arrowhead-${arrow.tone})`}
                  />
                </svg>
              </div>
            ))}
          </div>
          {steps.map((step) => (
            <div
              key={step.distance}
              className={
                step.distance === 0
                  ? "ui-distance-diagram__step ui-distance-diagram__step--has-base-markers"
                  : "ui-distance-diagram__step"
              }
            >
              <div className="ui-distance-diagram__annotation-stack">
                {annotations
                  .filter((annotation) => annotation.distance === step.distance)
                  .map((annotation) => (
                    <span
                      key={`${annotation.distance}-${annotation.label}`}
                      className="ui-distance-diagram__annotation"
                      data-tone={annotation.tone}
                    >
                      {annotation.label}
                    </span>
                  ))}
              </div>
              <div
                className="ui-distance-diagram__arrow-spacer"
                aria-hidden="true"
              />
              {step.distance === 0 && (
                <div
                  className="ui-distance-diagram__base-markers"
                  aria-hidden="true"
                >
                  <div
                    className="ui-distance-diagram__marker ui-distance-diagram__marker--base"
                    data-lane="upper"
                    data-tone="neutral"
                  />
                  <div
                    className="ui-distance-diagram__marker ui-distance-diagram__marker--base"
                    data-lane="lower"
                    data-tone="neutral"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
            <div>
              結果を自動保存しました。セッション ID:{" "}
              <code>{props.saveResult.sessionId}</code>
            </div>
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
  if (result.code === "UNAUTHORIZED") {
    return "ログイン状態を確認できませんでした。再度ログインしてからお試しください。";
  }

  if (result.code === "INVALID_INPUT") {
    return "セッション情報が不足しているため、この結果は保存できませんでした。";
  }

  return "結果を保存できませんでした。もう一度お試しください。";
}
