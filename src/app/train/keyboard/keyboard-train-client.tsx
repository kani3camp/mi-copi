"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { useGlobalUserSettings } from "../../../features/settings/client/global-user-settings-provider";
import { useTrainingSessionCore } from "../../../features/training/client/use-training-session-core";
import { shouldApplyDeferredTrainingBootstrap } from "../../../features/training/model/bootstrap";
import {
  clampIntervalMaxSemitone,
  clampIntervalMinSemitone,
  createDefaultQuestionCountEndCondition,
  createDefaultTimeLimitEndCondition,
  getQuestionCountSelectOptions,
  getTimeLimitSecondsSelectOptions,
  TRAINING_CONFIG_LIMITS,
} from "../../../features/training/model/config";
import { getTrainingModeTone } from "../../../features/training/model/format";
import { formatDirectionModeLabel } from "../../../features/training/model/interval-notation";
import { buildKeyboardGuestSummary } from "../../../features/training/model/keyboard-guest";
import { createKeyboardTrainingSessionAdapter } from "../../../features/training/model/modes/keyboard-session-adapter";
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
import {
  AppShell,
  Button,
  Field,
  FieldGrid,
  Notice,
  SectionHeader,
  Surface,
} from "../../ui/primitives";
import { formatRemainingTimeLabel } from "../train-ui-shared";
import { TrainingProgressHeader } from "../training-page-shell";

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

type KeyboardTrainRuntimeModule = typeof import("./keyboard-train-runtime");

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
  const [config, setConfig] = useState<KeyboardTrainingConfig>(initialConfig);
  const [bootstrapNotice, setBootstrapNotice] = useState<string | null>(null);
  const [bootstrapErrorMessage, setBootstrapErrorMessage] = useState<
    string | null
  >(null);
  const [persistConfigErrorMessage, setPersistConfigErrorMessage] = useState<
    string | null
  >(null);
  const [isBootstrapPending, startBootstrapTransition] = useTransition();
  const hasEditedConfigRef = useRef(false);
  const bootstrapPromiseRef =
    useRef<Promise<KeyboardTrainingPageBootstrap> | null>(null);
  const runtimePromiseRef = useRef<Promise<KeyboardTrainRuntimeModule> | null>(
    null,
  );
  const adapterRef = useRef<ReturnType<
    typeof createKeyboardTrainingSessionAdapter
  > | null>(null);

  const session = useTrainingSessionCore({
    adapterRef,
    config,
    isAuthenticated: isAuthenticatedState,
    masterVolume: settings.masterVolume,
    saveResultsAction,
    soundEffectsEnabled: settings.soundEffectsEnabled,
  });

  const plannedQuestionCount =
    config.endCondition.type === "question_count"
      ? config.endCondition.questionCount
      : 0;
  const questionCountOptions =
    getQuestionCountSelectOptions(plannedQuestionCount);
  const timeLimitOptions =
    config.endCondition.type === "time_limit"
      ? getTimeLimitSecondsSelectOptions(config.endCondition.timeLimitSeconds)
      : getTimeLimitSecondsSelectOptions(
          createDefaultTimeLimitEndCondition().timeLimitSeconds,
        );
  const answerChoices = NOTE_CLASS_OPTIONS;
  const summary = session.summary ?? buildKeyboardGuestSummary(session.results);
  const cannotSaveBecauseNoAnswers =
    session.phase === "result" && session.results.length === 0;

  const loadKeyboardRuntime = useCallback(() => {
    if (!runtimePromiseRef.current) {
      runtimePromiseRef.current = import("./keyboard-train-runtime").then(
        (runtime) => {
          adapterRef.current = createKeyboardTrainingSessionAdapter(runtime);
          return runtime;
        },
      );
    }

    return runtimePromiseRef.current;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warmUp = () => {
      void loadKeyboardRuntime();
      void import("./keyboard-train-panels");
    };

    if ("requestIdleCallback" in window) {
      const idleCallbackId = window.requestIdleCallback(warmUp, {
        timeout: 1500,
      });

      return () => {
        window.cancelIdleCallback(idleCallbackId);
      };
    }

    const timeoutId = globalThis.setTimeout(warmUp, 0);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [loadKeyboardRuntime]);

  useEffect(() => {
    if (!loadBootstrapAction) {
      return;
    }

    if (!bootstrapPromiseRef.current) {
      bootstrapPromiseRef.current = loadBootstrapAction();
    }

    const bootstrapPromise = bootstrapPromiseRef.current;

    if (!bootstrapPromise) {
      return;
    }

    let cancelled = false;

    startBootstrapTransition(async () => {
      try {
        const bootstrap = await bootstrapPromise;

        if (cancelled) {
          return;
        }

        setIsAuthenticatedState(bootstrap.isAuthenticated);
        setHasStoredConfigState(bootstrap.hasStoredConfig);
        setBootstrapErrorMessage(bootstrap.readWarningMessage);
        hydrateFromServer({
          isAuthenticated: bootstrap.isAuthenticated,
          settings: bootstrap.settings,
          updatedAt: bootstrap.settingsUpdatedAt,
        });

        if (
          bootstrap.config &&
          shouldApplyDeferredTrainingBootstrap({
            hasEditedConfig: hasEditedConfigRef.current,
            phase: session.phase,
            startedAt: session.startedAt,
          })
        ) {
          setConfig(bootstrap.config);
          setBootstrapNotice("前回設定を読み込み済みです。");
          return;
        }

        setBootstrapNotice(null);
      } catch {
        if (!cancelled) {
          setBootstrapNotice(null);
          setBootstrapErrorMessage(getStoredSettingsReadErrorMessage());
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    hydrateFromServer,
    loadBootstrapAction,
    session.phase,
    session.startedAt,
  ]);

  function updateConfig(
    updater: (current: KeyboardTrainingConfig) => KeyboardTrainingConfig,
  ) {
    hasEditedConfigRef.current = true;
    setBootstrapNotice(null);
    setPersistConfigErrorMessage(null);
    setConfig((current) => updater(current));
  }

  async function handleStart() {
    await loadKeyboardRuntime();

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
        questionLabel={getKeyboardHeaderLabel(
          session.phase,
          session.activeQuestion,
          plannedQuestionCount,
        )}
        meta={getKeyboardHeaderMeta({
          isAuthenticated: isAuthenticatedState,
          phase: session.phase,
          remainingTimeMs: session.remainingTimeMs,
          saveResult: session.saveResult,
        })}
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
        notice={
          session.audioError
            ? session.audioError
            : isAuthenticatedState
              ? "結果画面では自動保存されます。"
              : "ゲストでは保存されません。"
        }
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
                      updateConfig((current) => ({
                        ...current,
                        endCondition:
                          event.target.value === "time_limit"
                            ? createDefaultTimeLimitEndCondition()
                            : createDefaultQuestionCountEndCondition(),
                      }))
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
                        updateConfig((current) => ({
                          ...current,
                          endCondition: {
                            questionCount: Number(event.target.value),
                            type: "question_count",
                          },
                        }))
                      }
                      value={plannedQuestionCount}
                    >
                      {questionCountOptions.map((option) => (
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
                        updateConfig((current) => ({
                          ...current,
                          endCondition: {
                            timeLimitSeconds: Number(event.target.value),
                            type: "time_limit",
                          },
                        }))
                      }
                      value={config.endCondition.timeLimitSeconds}
                    >
                      {timeLimitOptions.map((option) => (
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
                      updateConfig((current) => {
                        const minSemitone = clampIntervalMinSemitone(
                          event.target.value,
                        );

                        return {
                          ...current,
                          intervalRange: {
                            maxSemitone: clampIntervalMaxSemitone(
                              current.intervalRange.maxSemitone,
                              minSemitone,
                            ),
                            minSemitone,
                          },
                        };
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
                      updateConfig((current) => ({
                        ...current,
                        intervalRange: {
                          ...current.intervalRange,
                          maxSemitone: clampIntervalMaxSemitone(
                            event.target.value,
                            current.intervalRange.minSemitone,
                          ),
                        },
                      }))
                    }
                    type="number"
                    value={config.intervalRange.maxSemitone}
                  />
                </Field>
                <Field label="出題方向">
                  <select
                    className="ui-select"
                    onChange={(event) =>
                      updateConfig((current) => ({
                        ...current,
                        directionMode: event.target
                          .value as KeyboardTrainingConfig["directionMode"],
                      }))
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
                      updateConfig((current) => ({
                        ...current,
                        baseNoteMode: event.target
                          .value as KeyboardTrainingConfig["baseNoteMode"],
                        fixedBaseNote:
                          event.target.value === "fixed"
                            ? (current.fixedBaseNote ?? "C")
                            : null,
                      }))
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
                      updateConfig((current) => ({
                        ...current,
                        fixedBaseNote: event.target.value as NoteClass,
                      }))
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
                    updateConfig((current) => ({
                      ...current,
                      includeUnison: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>同音を含める</span>
              </label>
              <label className="ui-checkbox-card">
                <input
                  checked={config.includeOctave}
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      includeOctave: event.target.checked,
                    }))
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

          {isBootstrapPending ? (
            <Notice>保存済み設定を確認しています...</Notice>
          ) : null}
          {bootstrapErrorMessage ? (
            <Notice tone="error">{bootstrapErrorMessage}</Notice>
          ) : null}
          {persistConfigErrorMessage ? (
            <Notice tone="error">{persistConfigErrorMessage}</Notice>
          ) : null}
          {bootstrapNotice ? <Notice>{bootstrapNotice}</Notice> : null}
          {isAuthenticatedState &&
          hasStoredConfigState &&
          !bootstrapNotice &&
          !bootstrapErrorMessage ? (
            <Notice>前回設定を読み込めます。</Notice>
          ) : null}

          {session.configError ? (
            <Notice tone="error">{session.configError}</Notice>
          ) : null}

          <div className="ui-sticky-actions">
            <Button
              block
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
          answerChoices={answerChoices}
          direction={session.activeQuestion.question.direction}
          onAnswer={session.answerQuestion}
          onReplayBase={session.replayBase}
          onReplayTarget={session.replayTarget}
          phase={session.phase}
          playbackKind={session.activeQuestion.playbackKind}
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
          cannotSaveBecauseNoAnswers={cannotSaveBecauseNoAnswers}
          finishReason={session.finishReason}
          isAuthenticated={isAuthenticatedState}
          isSavePending={session.isSavePending}
          onReset={handleReset}
          onRetrySave={session.retrySaveResults}
          saveResult={session.saveResult}
          summary={summary}
        />
      ) : null}
    </AppShell>
  );
}

function getKeyboardHeaderLabel(
  phase: SessionPhase,
  activeQuestion: { question: { questionIndex: number } } | null,
  plannedQuestionCount: number,
): string | undefined {
  if (phase === "result") {
    return "結果";
  }

  if (activeQuestion && plannedQuestionCount > 0) {
    return `${activeQuestion.question.questionIndex + 1} / ${plannedQuestionCount}`;
  }

  if (activeQuestion) {
    return `${activeQuestion.question.questionIndex + 1}`;
  }

  return phase === "config" ? undefined : formatPhaseLabel(phase);
}

function getKeyboardHeaderMeta(props: {
  isAuthenticated: boolean;
  phase: SessionPhase;
  remainingTimeMs: number | null;
  saveResult: SaveTrainingSessionResult | null;
}): string | null {
  if (props.phase === "result") {
    if (props.saveResult?.ok) {
      return "保存済み";
    }

    return props.isAuthenticated ? "保存待機" : "ゲスト";
  }

  if (props.remainingTimeMs !== null) {
    return formatRemainingTimeLabel(props.remainingTimeMs);
  }

  return null;
}

function formatPhaseLabel(phase: SessionPhase): string {
  switch (phase) {
    case "config":
      return "設定";
    case "preparing":
      return "準備中";
    case "playing":
      return "再生中";
    case "answering":
      return "回答中";
    case "feedback":
      return "フィードバック";
    case "result":
      return "結果";
  }
}
