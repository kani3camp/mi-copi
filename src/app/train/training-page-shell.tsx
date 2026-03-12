import type { ReactNode } from "react";

import { Chip, PageHero } from "../ui/primitives";

const TRAIN_PHASE_ORDER = [
  "config",
  "preparing",
  "playing",
  "answering",
  "feedback",
  "result",
] as const;

export function TrainingPageHero(props: {
  title: string;
  subtitle: string;
  phase: (typeof TRAIN_PHASE_ORDER)[number];
  phaseLabel: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const currentPhaseIndex = TRAIN_PHASE_ORDER.indexOf(props.phase);

  return (
    <PageHero
      title={props.title}
      subtitle={props.subtitle}
      eyebrow="Training Flow"
      actions={props.actions}
      className="ui-train-hero"
    >
      <div className="ui-train-phase-strip">
        <div className="ui-inline-split">
          <div className="ui-stack-sm">
            <span className="ui-muted">現在のフェーズ</span>
            <Chip tone={getPhaseTone(props.phase)}>{props.phaseLabel}</Chip>
          </div>
        </div>
        <div className="ui-train-phase-strip__bar" aria-hidden="true">
          {TRAIN_PHASE_ORDER.map((phase, index) => {
            const state =
              index < currentPhaseIndex
                ? "done"
                : index === currentPhaseIndex
                  ? "active"
                  : "idle";

            return (
              <div
                key={phase}
                className="ui-train-phase-strip__step"
                data-state={state}
              >
                <div className="ui-train-phase-strip__dot" />
                <span className="ui-train-phase-strip__label">
                  {formatTrainPhaseLabel(phase)}
                </span>
              </div>
            );
          })}
        </div>
        {props.children}
      </div>
    </PageHero>
  );
}

function getPhaseTone(
  phase: (typeof TRAIN_PHASE_ORDER)[number],
): "neutral" | "active" | "info" | "success" | "error" {
  switch (phase) {
    case "answering":
    case "playing":
      return "active";
    case "feedback":
      return "info";
    case "result":
      return "success";
    default:
      return "neutral";
  }
}

function formatTrainPhaseLabel(
  phase: (typeof TRAIN_PHASE_ORDER)[number],
): string {
  switch (phase) {
    case "config":
      return "設定";
    case "preparing":
      return "準備";
    case "playing":
      return "再生";
    case "answering":
      return "回答";
    case "feedback":
      return "FB";
    case "result":
      return "結果";
  }
}
