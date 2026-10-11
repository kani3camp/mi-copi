"use client";

import { useCallback, useReducer, useRef, useState } from "react";

import { useGlobalUserSettings } from "../../../features/settings/client/global-user-settings-provider";
import { useTrainingSessionCore } from "../../../features/training/client/use-training-session-core";
import { getTrainingModeTone } from "../../../features/training/model/format";
import { distanceTrainingSessionAdapter } from "../../../features/training/model/modes/distance-session-adapter";
import type {
  DistanceTrainingConfig,
  SaveTrainingSessionInput,
  SessionPhase,
} from "../../../features/training/model/types";
import type { DistanceTrainingPageBootstrap } from "../../../features/training/server/getTrainingPageBootstrap";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  getStoredSettingsReadErrorMessage,
  getTrainingConfigPersistErrorMessage,
} from "../../../lib/async-action-errors";
import { ButtonLink } from "../../ui/navigation-link";
import { AppShell, Notice, SectionHeader, Surface } from "../../ui/primitives";
import { confirmManualSessionEnd } from "../train-ui-shared";
import {
  type DistanceTrainingConfigAction,
  reduceDistanceTrainingConfig,
} from "../training-config-form-state";
import { TrainingConfigPanel } from "../training-config-panel";
import { TrainingProgressHeader } from "../training-page-shell";
import { useTrainingRouteBootstrap } from "../training-route-bootstrap";
import {
  DistanceFeedbackPanel,
  DistanceQuestionPanel,
  DistanceResultPanel,
} from "./distance-train-panels";
import { buildDistanceTrainViewModel } from "./distance-train-presenter";

interface DistanceTrainClientProps {
  hasStoredConfig: boolean;
  initialConfig: DistanceTrainingConfig;
  isAuthenticated: boolean;
  loadBootstrapAction?: () => Promise<DistanceTrainingPageBootstrap>;
  persistLastUsedConfigAction: (
    config: DistanceTrainingConfig,
  ) => Promise<void>;
  saveResultsAction: (
    input: SaveTrainingSessionInput,
  ) => Promise<SaveTrainingSessionResult>;
}

export function DistanceTrainClient({
  hasStoredConfig,
  initialConfig,
  isAuthenticated,
  loadBootstrapAction,
  persistLastUsedConfigAction,
  saveResultsAction,
}: DistanceTrainClientProps) {
  const { settings, hydrateFromServer } = useGlobalUserSettings();
  const [isAuthenticatedState, setIsAuthenticatedState] =
    useState(isAuthenticated);
  const [hasStoredConfigState, setHasStoredConfigState] =
    useState(hasStoredConfig);
  const [config, dispatchConfig] = useReducer(
    reduceDistanceTrainingConfig,
    initialConfig,
  );
  const [persistConfigErrorMessage, setPersistConfigErrorMessage] = useState<
    string | null
  >(null);
  const applyBootstrapConfig = useCallback(
    (nextConfig: DistanceTrainingConfig) => {
      dispatchConfig({ type: "replace_config", config: nextConfig });
    },
    [],
  );
  const handleBootstrapResolved = useCallback(
    ({
      hasStoredConfig,
      isAuthenticated,
    }: {
      hasStoredConfig: boolean;
      isAuthenticated: boolean;
    }) => {
      setHasStoredConfigState(hasStoredConfig);
      setIsAuthenticatedState(isAuthenticated);
    },
    [],
  );
  const adapterRef = useRef(distanceTrainingSessionAdapter);
  const session = useTrainingSessionCore({
    adapterRef,
    config,
    isAuthenticated: isAuthenticatedState,
    masterVolume: settings.masterVolume,
    saveResultsAction,
    soundEffectsEnabled: settings.soundEffectsEnabled,
  });
  const bootstrap = useTrainingRouteBootstrap({
    loadBootstrapAction,
    onApplyConfig: applyBootstrapConfig,
    onBootstrapResolved: handleBootstrapResolved,
    onHydrateSettings: hydrateFromServer,
    phase: session.phase,
    readErrorMessage: getStoredSettingsReadErrorMessage(),
    startedAt: session.startedAt,
  });
  const viewModel = buildDistanceTrainViewModel({
    activeQuestionIndex: session.activeQuestion?.question.questionIndex ?? null,
    audioError: session.audioError,
    config,
    intervalNotationStyle: settings.intervalNotationStyle,
    isAuthenticated: isAuthenticatedState,
    phase: session.phase,
    remainingTimeMs: session.remainingTimeMs,
    results: session.results,
    saveResult: session.saveResult,
    summary: session.summary,
  });
  const isStartBlockedByBootstrap =
    isAuthenticatedState && bootstrap.isBootstrapReady === false;

  function dispatchConfigAction(action: DistanceTrainingConfigAction) {
    bootstrap.handleConfigEdit();
    setPersistConfigErrorMessage(null);
    dispatchConfig(action);
  }

  function handleStart() {
    if (isStartBlockedByBootstrap) {
      return;
    }

    const result = session.startSession();

    if (!result.ok) {
      return;
    }

    setPersistConfigErrorMessage(null);

    if (isAuthenticatedState) {
      void persistLastUsedConfigAction(config)
        .then(() => {
          setPersistConfigErrorMessage(null);
        })
        .catch(() => {
          setPersistConfigErrorMessage(getTrainingConfigPersistErrorMessage());
        });
    }
  }

  function handleReset() {
    session.resetSession();
    setPersistConfigErrorMessage(null);
  }

  function handleEndSession() {
    if (!confirmManualSessionEnd()) {
      return;
    }

    session.endSessionManually();
  }

  return (
    <AppShell narrow className="ui-train-shell">
      <TrainingProgressHeader
        modeLabel="距離モード"
        modeTone={getTrainingModeTone("distance")}
        questionLabel={
          session.phase === "config" ? undefined : viewModel.questionLabel
        }
        meta={
          <DistanceTrainingHeaderMeta
            phase={session.phase}
            runningScoreLabel={viewModel.runningScoreLabel}
            statusLabel={viewModel.headerMeta}
          />
        }
        actions={
          <ButtonLink
            href="/"
            pendingLabel="ホームを開いています..."
            size="compact"
            variant="ghost"
          >
            戻る
          </ButtonLink>
        }
        notice={viewModel.headerNotice}
      />

      {session.phase !== "config" && persistConfigErrorMessage ? (
        <Notice tone="error">{persistConfigErrorMessage}</Notice>
      ) : null}

      {session.phase === "config" ? (
        <TrainingConfigPanel
          config={config}
          onChange={dispatchConfigAction}
          questionCountOptions={viewModel.questionCountOptions}
          timeLimitOptions={viewModel.timeLimitOptions}
          answerChoiceChips={viewModel.answerChoiceChips}
          onGranularityChange={(value) =>
            dispatchConfigAction({ type: "set_interval_granularity", value })
          }
          onStart={handleStart}
          startDisabled={isStartBlockedByBootstrap}
        >
          {bootstrap.isBootstrapPending ? (
            <Notice>保存済み設定を確認しています...</Notice>
          ) : null}
          {bootstrap.bootstrapErrorMessage ? (
            <Notice tone="error">{bootstrap.bootstrapErrorMessage}</Notice>
          ) : null}
          {persistConfigErrorMessage ? (
            <Notice tone="error">{persistConfigErrorMessage}</Notice>
          ) : null}
          {bootstrap.bootstrapNotice ? (
            <Notice>{bootstrap.bootstrapNotice}</Notice>
          ) : null}
          {isAuthenticatedState &&
          hasStoredConfigState &&
          !bootstrap.bootstrapNotice &&
          !bootstrap.bootstrapErrorMessage ? (
            <Notice>前回設定を読み込めます。</Notice>
          ) : null}

          {session.configError ? (
            <Notice tone="error">{session.configError}</Notice>
          ) : null}
        </TrainingConfigPanel>
      ) : null}

      {session.phase === "preparing" && session.activeQuestion ? (
        <Surface tone="accent">
          <SectionHeader
            title="準備中"
            description="次の問題を準備して、基準音と問題音の再生に入ります。"
          />
          <Notice>
            問題 {session.activeQuestion.question.questionIndex + 1}{" "}
            を準備しています...
          </Notice>
        </Surface>
      ) : null}

      {(session.phase === "playing" || session.phase === "answering") &&
      session.activeQuestion ? (
        <DistanceQuestionPanel
          answerChoiceRows={viewModel.answerChoiceRows}
          direction={session.activeQuestion.question.direction}
          intervalNotationStyle={settings.intervalNotationStyle}
          isPlaybackLocked={session.phase === "playing"}
          onAnswer={session.answerQuestion}
          onReplayBase={session.replayBase}
          onReplayTarget={session.replayTarget}
          questionIndex={session.activeQuestion.question.questionIndex}
          replayBaseCount={session.activeQuestion.replayBaseCount}
          replayTargetCount={session.activeQuestion.replayTargetCount}
        />
      ) : null}

      {session.phase === "feedback" && session.feedbackResult ? (
        <DistanceFeedbackPanel
          feedbackResult={session.feedbackResult}
          intervalNotationStyle={settings.intervalNotationStyle}
          lastAnsweredWasFinal={session.lastAnsweredWasFinal}
          onContinue={session.continueAfterFeedback}
          onEndSession={handleEndSession}
          onReplayBase={session.replayBase}
          onReplayCorrectTarget={session.replayCorrectTarget}
        />
      ) : null}

      {session.phase === "result" ? (
        <DistanceResultPanel
          canSaveResult={session.canSaveResult}
          cannotSaveBecauseNoAnswers={viewModel.cannotSaveBecauseNoAnswers}
          finishReason={session.finishReason}
          intervalNotationStyle={settings.intervalNotationStyle}
          isAuthenticated={isAuthenticatedState}
          isSavePending={session.isSavePending}
          onReset={handleReset}
          onRetrySave={session.retrySaveResults}
          recentResults={viewModel.recentResults}
          saveResult={session.saveResult}
          summary={viewModel.summary}
        />
      ) : null}
    </AppShell>
  );
}

function DistanceTrainingHeaderMeta(props: {
  phase: SessionPhase;
  statusLabel: string | null;
  runningScoreLabel: string | null;
}) {
  if (props.phase === "result") {
    return props.statusLabel;
  }

  if (!props.statusLabel && !props.runningScoreLabel) {
    return null;
  }

  return (
    <div className="ui-training-progress-meta">
      {props.statusLabel ? (
        <div className="ui-training-progress-meta__item" data-tone="info">
          <span className="ui-training-progress-meta__label">残り</span>
          <strong className="ui-training-progress-meta__value">
            {props.statusLabel}
          </strong>
        </div>
      ) : null}
      {props.runningScoreLabel ? (
        <div className="ui-training-progress-meta__item" data-tone="brand">
          <span className="ui-training-progress-meta__label">スコア</span>
          <strong className="ui-training-progress-meta__value">
            {props.runningScoreLabel}
          </strong>
        </div>
      ) : null}
    </div>
  );
}
