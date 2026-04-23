import {
  createDefaultTimeLimitEndCondition,
  getQuestionCountSelectOptions,
  getTimeLimitSecondsSelectOptions,
} from "../../../features/training/model/config.ts";
import {
  buildDistanceGuestSummary,
  type DistanceGuestResult,
  type DistanceGuestSummary,
  getDistanceAnswerChoices,
  getDistanceQuestionCount,
} from "../../../features/training/model/distance-guest.ts";
import { formatScoreLabel } from "../../../features/training/model/format.ts";
import { getIntervalLabel } from "../../../features/training/model/interval-notation.ts";
import type {
  DistanceTrainingConfig,
  IntervalNotationStyle,
  SessionPhase,
} from "../../../features/training/model/types.ts";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession.ts";
import {
  buildTrainingHeaderMeta,
  buildTrainingHeaderNotice,
  formatTrainingPhaseLabel,
} from "../training-route-header.ts";

export function buildDistanceTrainViewModel(props: {
  config: DistanceTrainingConfig;
  intervalNotationStyle: IntervalNotationStyle;
  isAuthenticated: boolean;
  phase: SessionPhase;
  remainingTimeMs: number | null;
  results: DistanceGuestResult[];
  saveResult: SaveTrainingSessionResult | null;
  summary: DistanceGuestSummary | null;
  activeQuestionIndex: number | null;
  audioError: string | null;
}) {
  const plannedQuestionCount = getDistanceQuestionCount(props.config);
  const questionCountOptions =
    getQuestionCountSelectOptions(plannedQuestionCount);
  const timeLimitOptions =
    props.config.endCondition.type === "time_limit"
      ? getTimeLimitSecondsSelectOptions(
          props.config.endCondition.timeLimitSeconds,
        )
      : getTimeLimitSecondsSelectOptions(
          createDefaultTimeLimitEndCondition().timeLimitSeconds,
        );
  const answerChoiceValues = getDistanceAnswerChoices(props.config);
  const answerChoiceRows = splitAnswerChoicesIntoRows(answerChoiceValues);
  const cannotSaveBecauseNoAnswers =
    props.phase === "result" && props.results.length === 0;
  const liveSummary = props.summary ?? buildDistanceGuestSummary(props.results);
  const isActiveTrainingPhase =
    props.phase === "preparing" ||
    props.phase === "playing" ||
    props.phase === "answering" ||
    props.phase === "feedback";

  return {
    answerChoiceChips: answerChoiceValues.map((choice) => ({
      label: getIntervalLabel(choice, props.intervalNotationStyle),
      value: choice,
    })),
    answerChoiceRows,
    answerChoiceValues,
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
    questionCountOptions,
    questionLabel: getDistanceHeaderLabel(
      props.phase,
      props.activeQuestionIndex,
      plannedQuestionCount,
    ),
    recentResults: props.results.slice(-3).reverse(),
    runningScoreLabel: isActiveTrainingPhase
      ? formatScoreLabel(liveSummary.sessionScore)
      : null,
    summary: liveSummary,
    timeLimitOptions,
  };
}

function getDistanceHeaderLabel(
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

function splitAnswerChoicesIntoRows(values: number[]): number[][] {
  if (values.length === 0) {
    return [];
  }

  const midpoint = Math.ceil(values.length / 2);

  return [values.slice(0, midpoint), values.slice(midpoint)].filter(
    (row) => row.length > 0,
  );
}
