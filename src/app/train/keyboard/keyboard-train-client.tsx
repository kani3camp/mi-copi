"use client";

import dynamic from "next/dynamic";
import { useCallback, useReducer, useState } from "react";

import { useGlobalUserSettings } from "../../../features/settings/client/global-user-settings-provider";
import { useTrainingSessionCore } from "../../../features/training/client/use-training-session-core";
import { TRAINING_CONFIG_LIMITS } from "../../../features/training/model/config";
import { getTrainingModeTone } from "../../../features/training/model/format";
import { formatDirectionModeLabel } from "../../../features/training/model/interval-notation";
import type {
  KeyboardTrainingConfig,
  NoteClass,
  SaveTrainingSessionInput,
} from "../../../features/training/model/types";
import type { KeyboardTrainingPageBootstrap } from "../../../features/training/server/getTrainingPageBootstrap";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  getStoredSettingsReadErrorMessage,
  getTrainingConfigPersistErrorMessage,
} from "../../../lib/async-action-errors";
import { ButtonLink } from "../../ui/navigation-link";
import {
  AppShell,
  Button,
  Field,
  FieldGrid,
  Notice,
  SectionHeader,
  Surface,
} from "../../ui/primitives";
import {
  type KeyboardTrainingConfigAction,
  reduceKeyboardTrainingConfig,
} from "../training-config-form-state";
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

  return (
    <AppShell narrow className="ui-train-shell">
      <TrainingProgressHeader
        modeLabel="鍵盤モード"
        modeTone={getTrainingModeTone("keyboard")}
        questionLabel={viewModel.questionLabel}
        meta={viewModel.headerMeta}
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
        <Surface tone="accent">
          <SectionHeader
            title="出題設定"
            description="必要な設定だけを整えて、そのまま開始します。"
          />
          <div className="ui-form-layout">
            <div className="ui-form-section">
              <h3 className="ui-form-section__title">終了条件</h3>
              <FieldGrid>
                <Field label="終了方法">
                  <select
                    className="ui-select"
                    onChange={(event) =>
                      dispatchConfigAction({
                        type: "set_end_condition_type",
                        value: event.target.value,
                      })
                    }
                    value={config.endCondition.type}
                  >
                    <option value="question_count">問題数</option>
                    <option value="time_limit">制限時間</option>
                  </select>
                </Field>
                {config.endCondition.type === "question_count" ? (
                  <Field label="問題数">
                    <select
                      className="ui-select"
                      onChange={(event) =>
                        dispatchConfigAction({
                          type: "set_question_count",
                          value: event.target.value,
                        })
                      }
                      value={config.endCondition.questionCount}
                    >
                      {viewModel.questionCountOptions.map((option) => (
                        <option key={option} value={option}>
                          {option} 問
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label="制限時間（秒）">
                    <select
                      className="ui-select"
                      onChange={(event) =>
                        dispatchConfigAction({
                          type: "set_time_limit_seconds",
                          value: event.target.value,
                        })
                      }
                      value={config.endCondition.timeLimitSeconds}
                    >
                      {viewModel.timeLimitOptions.map((option) => (
                        <option key={option} value={option}>
                          {option} 秒
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </FieldGrid>
            </div>

            <div className="ui-form-section">
              <h3 className="ui-form-section__title">出題範囲</h3>
              <FieldGrid>
                <Field label="最小半音数">
                  <input
                    className="ui-input"
                    max={TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.max}
                    min={TRAINING_CONFIG_LIMITS.intervalRange.minSemitone.min}
                    onChange={(event) =>
                      dispatchConfigAction({
                        type: "set_min_semitone",
                        value: event.target.value,
                      })
                    }
                    type="number"
                    value={config.intervalRange.minSemitone}
                  />
                </Field>
                <Field label="最大半音数">
                  <input
                    className="ui-input"
                    max={TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.max}
                    min={Math.max(
                      TRAINING_CONFIG_LIMITS.intervalRange.maxSemitone.min,
                      config.intervalRange.minSemitone,
                    )}
                    onChange={(event) =>
                      dispatchConfigAction({
                        type: "set_max_semitone",
                        value: event.target.value,
                      })
                    }
                    type="number"
                    value={config.intervalRange.maxSemitone}
                  />
                </Field>
                <Field label="出題方向">
                  <select
                    className="ui-select"
                    onChange={(event) =>
                      dispatchConfigAction({
                        type: "set_direction_mode",
                        value: event.target.value,
                      })
                    }
                    value={config.directionMode}
                  >
                    <option value="mixed">
                      {formatDirectionModeLabel("mixed")}
                    </option>
                    <option value="up_only">
                      {formatDirectionModeLabel("up_only")}
                    </option>
                  </select>
                </Field>
                <Field label="基準音モード">
                  <select
                    className="ui-select"
                    onChange={(event) =>
                      dispatchConfigAction({
                        type: "set_base_note_mode",
                        value: event.target.value,
                      })
                    }
                    value={config.baseNoteMode}
                  >
                    <option value="random">ランダム</option>
                    <option value="fixed">固定</option>
                  </select>
                </Field>
              </FieldGrid>

              {config.baseNoteMode === "fixed" ? (
                <Field label="固定する基準音">
                  <select
                    className="ui-select"
                    onChange={(event) =>
                      dispatchConfigAction({
                        type: "set_fixed_base_note",
                        value: event.target.value,
                      })
                    }
                    value={config.fixedBaseNote ?? "C"}
                  >
                    {NOTE_CLASS_OPTIONS.map((note) => (
                      <option key={note} value={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>

            <div className="ui-form-section">
              <h3 className="ui-form-section__title">回答スタイル</h3>
              <label className="ui-checkbox-card">
                <input
                  checked={config.includeUnison}
                  onChange={(event) =>
                    dispatchConfigAction({
                      type: "toggle_include_unison",
                      checked: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>同音を含める</span>
              </label>
              <label className="ui-checkbox-card">
                <input
                  checked={config.includeOctave}
                  onChange={(event) =>
                    dispatchConfigAction({
                      type: "toggle_include_octave",
                      checked: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>オクターブを含める</span>
              </label>
              <p className="ui-form-inline-note">
                {settings.keyboardNoteLabelsVisible
                  ? "鍵盤ラベルは表示中です。黒鍵はシャープ / フラット表記で出ます。"
                  : "鍵盤ラベルは非表示です。表示切替は設定画面で行えます。"}
              </p>
              <p className="ui-mini-note">回答候補は 12 音すべてです。</p>
            </div>
          </div>

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

          <div className="ui-sticky-actions">
            <Button
              block
              disabled={isStartBlockedByBootstrap}
              onClick={() => void handleStart()}
              type="button"
              variant="primary"
            >
              開始
            </Button>
          </div>
        </Surface>
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
          onEndSession={session.endSessionManually}
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
