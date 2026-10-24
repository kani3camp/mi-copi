import type { ReactNode } from "react";

import type { TrainingModeTone } from "../../features/training/model/format";
import { Chip } from "../ui/primitives";

export function TrainingProgressHeader(props: {
  modeLabel: string;
  modeTone?: TrainingModeTone;
  questionLabel?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  notice?: ReactNode;
  className?: string;
}) {
  return (
    <header className={props.className ?? "ui-training-progress-header"}>
      <div className="ui-training-progress-header__utility">
        <div className="ui-training-progress-header__actions">
          {props.actions}
        </div>
        <Chip
          tone={props.modeTone ?? "brand"}
          className={props.modeTone ? "ui-chip--mode" : undefined}
        >
          {props.modeLabel}
        </Chip>
      </div>
      {props.questionLabel || props.meta ? (
        <div className="ui-training-progress-header__status">
          {props.questionLabel ? (
            <strong className="ui-training-progress-header__question">
              {props.questionLabel}
            </strong>
          ) : null}
          {props.meta ? (
            <div className="ui-training-progress-header__meta">
              {props.meta}
            </div>
          ) : null}
        </div>
      ) : null}
      {props.notice ? (
        <div className="ui-training-progress-header__notice">
          {props.notice}
        </div>
      ) : null}
    </header>
  );
}
