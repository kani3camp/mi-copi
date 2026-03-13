import type { ReactNode } from "react";

import { Chip } from "../ui/primitives";

export function TrainingProgressHeader(props: {
  modeLabel: string;
  modeTone?: "brand" | "teal" | "blue";
  questionLabel?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  notice?: ReactNode;
  className?: string;
}) {
  return (
    <header className={props.className ?? "ui-training-progress-header"}>
      <div className="ui-training-progress-header__row">
        <div className="ui-training-progress-header__actions">
          {props.actions}
        </div>
        <div className="ui-training-progress-header__status">
          {props.questionLabel ? (
            <span className="ui-training-progress-header__question">
              {props.questionLabel}
            </span>
          ) : null}
          <Chip tone={props.modeTone ?? "brand"}>{props.modeLabel}</Chip>
          {props.meta ? (
            <span className="ui-training-progress-header__meta">
              {props.meta}
            </span>
          ) : null}
        </div>
      </div>
      {props.notice ? (
        <div className="ui-training-progress-header__notice">
          {props.notice}
        </div>
      ) : null}
    </header>
  );
}
