"use client";

import dynamic from "next/dynamic";
import { useCallback, useReducer, useState } from "react";

import { useGlobalUserSettings } from "../../../features/settings/client/global-user-settings-provider";
import { useTrainingSessionCore } from "../../../features/training/client/use-training-session-core";
import { getTrainingModeTone } from "../../../features/training/model/format";
import type {
  KeyboardTrainingConfig,
  NoteClass,
  SaveTrainingSessionInput,
  SessionPhase,
} from "../../../features/training/model/types";
import type { KeyboardTrainingPageBootstrap } from "../../../features/training/server/getTrainingPageBootstrap";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  getStoredSettingsReadErrorMessage,
  getTrainingConfigPersistErrorMessage,
} from "../../../lib/async-action-errors";
import { ButtonLink } from "../../ui/navigation-link";
import { AppShell, Notice, SectionHeader, Surface } from "../../ui/primitives";
import { confirmManualSessionEnd } from "../train-ui-shared";
import {
  type KeyboardTrainingConfigAction,
  reduceKeyboardTrainingConfig,
} from "../training-config-form-state";
import { TrainingConfigPanel } from "../training-config-panel";
import { TrainingProgressHeader } from "../training-page-shell";
import { useTrainingRouteBootstrap } from "../training-route-bootstrap";
import { buildKeyboardTrainViewModel } from "./keyboard-train-presenter";
import { useKeyboardTrainingRuntime } from "./use-keyboard-training-runtime";

const KeyboardQuestionPanel = dynamic(async () => {
  const mod = await import("./keyboard-train-panels");

  return mod.KeyboardQuestionPanel;
});

const KeyboardFeedbackPanel = dynamic(async () => {
  const mod = await import("./keyboard-train-panels");

  return mod.KeyboardFeedbackPanel;
});

const KeyboardResultPanel = dynamic(async () => {
  const mod = await import("./keyboard-train-panels");

  return mod.KeyboardResultPanel;
});

const NOTE_CLASS_OPTIONS: NoteClass[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

interface KeyboardTrainClientProps {
  hasStoredConfig: boolean;
  initialConfig: KeyboardTrainingConfig;
  isAuthenticated: boolean;
  loadBootstrapAction?: () => Promise<KeyboardTrainingPageBootstrap>;
  persistLastUsedConfigAction: (
    config: KeyboardTrainingConfig,
  ) => Promise<void>;
  saveResultsAction: (
    input: SaveTrainingSessionInput,
  ) => Promise<SaveTrainingSessionResult>;
}

export function KeyboardTrainClient({
  hasStoredConfig,
  initialConfig,
  isAuthenticated,
  loadBootstrapAction,
  persistLastUsedConfigAction,
  saveResultsAction,
}: KeyboardTrainClientProps) {
  const { settings, hydrateFromServer } = useGlobalUserSettings();
  const [isAuthenticatedState, setIsAuthenticatedState] =
    useState(isAuthenticated);
  const [hasStoredConfigState, setHasStoredConfigState] =
    useState(hasStoredConfig);
  const [config, dispatchConfig] = useReducer(
    reduceKeyboardTrainingConfig,
    initialConfig,
  );
  const [persistConfigErrorMessage, setPersistConfigErrorMessage] = useState<
    string | null
  >(null);
  const applyBootstrapConfig = useCallback(
    (nextConfig: KeyboardTrainingConfig) => {
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
  const { adapterRef, ensureReadyForStart } = useKeyboardTrainingRuntime();
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
  const viewModel = buildKeyboardTrainViewModel({
    activeQuestionIndex: session.activeQuestion?.question.questionIndex ?? null,
    audioError: session.audioError,
    config,
    isAuthenticated: isAuthenticatedState,
    phase: session.phase,
    remainingTimeMs: session.remainingTimeMs,
    results: session.results,
    saveResult: session.saveResult,
    summary: session.summary,
  });
  const isStartBlockedByBootstrap =
    isAuthenticatedState && bootstrap.isBootstrapReady === false;

  function dispatchConfigAction(action: KeyboardTrainingConfigAction) {
    bootstrap.handleConfigEdit();
    setPersistConfigErrorMessage(null);
    dispatchConfig(action);
  }

  async function handleStart() {
    if (isStartBlockedByBootstrap) {
      return;
    }

    await ensureReadyForStart();

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
        modeLabel="鍵盤モード"
        modeTone={getTrainingModeTone("keyboard")}
        questionLabel={
          session.phase === "config" ? undefined : viewModel.questionLabel
        }
        meta={
          <KeyboardTrainingHeaderMeta
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
          keyboardLabelsVisible={settings.keyboardNoteLabelsVisible}
          onStart={() => void handleStart()}
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
        <KeyboardQuestionPanel
          answerChoices={NOTE_CLASS_OPTIONS}
          direction={session.activeQuestion.question.direction}
          isPlaybackLocked={session.phase === "playing"}
          onAnswer={session.answerQuestion}
          onReplayBase={session.replayBase}
          onReplayTarget={session.replayTarget}
          questionIndex={session.activeQuestion.question.questionIndex}
          referenceNote={session.activeQuestion.question.baseNote}
          replayBaseCount={session.activeQuestion.replayBaseCount}
          replayTargetCount={session.activeQuestion.replayTargetCount}
          showLabels={settings.keyboardNoteLabelsVisible}
        />
      ) : null}

      {session.phase === "feedback" && session.feedbackResult ? (
        <KeyboardFeedbackPanel
          feedbackResult={session.feedbackResult}
          lastAnsweredWasFinal={session.lastAnsweredWasFinal}
          onContinue={session.continueAfterFeedback}
          onEndSession={handleEndSession}
          onReplayBase={session.replayBase}
          onReplayCorrectTarget={session.replayCorrectTarget}
          showLabels={settings.keyboardNoteLabelsVisible}
        />
      ) : null}

      {session.phase === "result" ? (
        <KeyboardResultPanel
          canSaveResult={session.canSaveResult}
          cannotSaveBecauseNoAnswers={viewModel.cannotSaveBecauseNoAnswers}
          finishReason={session.finishReason}
          isAuthenticated={isAuthenticatedState}
          isSavePending={session.isSavePending}
          onReset={handleReset}
          onRetrySave={session.retrySaveResults}
          saveResult={session.saveResult}
          summary={viewModel.summary}
        />
      ) : null}
    </AppShell>
  );
}

function KeyboardTrainingHeaderMeta(props: {
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
