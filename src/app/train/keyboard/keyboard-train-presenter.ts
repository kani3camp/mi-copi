import {
  createDefaultTimeLimitEndCondition,
  getQuestionCountSelectOptions,
  getTimeLimitSecondsSelectOptions,
} from "../../../features/training/model/config.ts";
import type { KeyboardGuestResult } from "../../../features/training/model/keyboard-guest.ts";
import {
  buildKeyboardGuestSummary,
  type KeyboardGuestSummary,
} from "../../../features/training/model/keyboard-guest.ts";
import type {
  KeyboardTrainingConfig,
  SessionPhase,
} from "../../../features/training/model/types.ts";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession.ts";
import {
  buildTrainingHeaderMeta,
  buildTrainingHeaderNotice,
  formatTrainingPhaseLabel,
} from "../training-route-header.ts";

export function buildKeyboardTrainViewModel(props: {
  audioError: string | null;
  config: KeyboardTrainingConfig;
  isAuthenticated: boolean;
  phase: SessionPhase;
  remainingTimeMs: number | null;
  results: KeyboardGuestResult[];
  saveResult: SaveTrainingSessionResult | null;
  summary: KeyboardGuestSummary | null;
  activeQuestionIndex: number | null;
}) {
  const plannedQuestionCount =
    props.config.endCondition.type === "question_count"
      ? props.config.endCondition.questionCount
      : 0;
  const cannotSaveBecauseNoAnswers =
    props.phase === "result" && props.results.length === 0;

  return {
    cannotSaveBecauseNoAnswers,
    headerMeta: buildTrainingHeaderMeta({
      cannotSaveBecauseNoAnswers,
      isAuthenticated: props.isAuthenticated,
      phase: props.phase,
      remainingTimeMs: props.remainingTimeMs,
      saveResult: props.saveResult,
    }),
    headerNotice: buildTrainingHeaderNotice({
      audioError: props.audioError,
      isAuthenticated: props.isAuthenticated,
    }),
    questionCountOptions: getQuestionCountSelectOptions(plannedQuestionCount),
    questionLabel: getKeyboardHeaderLabel(
      props.phase,
      props.activeQuestionIndex,
      plannedQuestionCount,
    ),
    summary: props.summary ?? buildKeyboardGuestSummary(props.results),
    timeLimitOptions:
      props.config.endCondition.type === "time_limit"
        ? getTimeLimitSecondsSelectOptions(
            props.config.endCondition.timeLimitSeconds,
          )
        : getTimeLimitSecondsSelectOptions(
            createDefaultTimeLimitEndCondition().timeLimitSeconds,
          ),
  };
}

function getKeyboardHeaderLabel(
  phase: SessionPhase,
  activeQuestionIndex: number | null,
  plannedQuestionCount: number,
): string | undefined {
  if (phase === "result") {
    return "結果";
  }

  if (activeQuestionIndex !== null && plannedQuestionCount > 0) {
    return `${activeQuestionIndex + 1} / ${plannedQuestionCount}`;
  }

  if (activeQuestionIndex !== null) {
    return `${activeQuestionIndex + 1}`;
  }

  return phase === "config" ? undefined : formatTrainingPhaseLabel(phase);
}
