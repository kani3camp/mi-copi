"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

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
import {
  buildDistanceGuestSummary,
  getDistanceAnswerChoices,
  getDistanceQuestionCount,
} from "../../../features/training/model/distance-guest";
import { getTrainingModeTone } from "../../../features/training/model/format";
import {
  formatDirectionModeLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import { distanceTrainingSessionAdapter } from "../../../features/training/model/modes/distance-session-adapter";
import type {
  DistanceTrainingConfig,
  NoteClass,
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
import {
  AppShell,
  Button,
  Chip,
  Field,
  FieldGrid,
  Notice,
  SectionHeader,
  Surface,
} from "../../ui/primitives";
import { formatRemainingTimeLabel } from "../train-ui-shared";
import { TrainingProgressHeader } from "../training-page-shell";
import {
  DistanceFeedbackPanel,
  DistanceQuestionPanel,
  DistanceResultPanel,
} from "./distance-train-panels";

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
  const [config, setConfig] = useState<DistanceTrainingConfig>(initialConfig);
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
    useRef<Promise<DistanceTrainingPageBootstrap> | null>(null);
  const adapterRef = useRef(distanceTrainingSessionAdapter);

  const session = useTrainingSessionCore({
    adapterRef,
    config,
    isAuthenticated: isAuthenticatedState,
    masterVolume: settings.masterVolume,
    saveResultsAction,
    soundEffectsEnabled: settings.soundEffectsEnabled,
  });

  const plannedQuestionCount = getDistanceQuestionCount(config);
  const questionCountOptions =
    getQuestionCountSelectOptions(plannedQuestionCount);
  const timeLimitOptions =
    config.endCondition.type === "time_limit"
      ? getTimeLimitSecondsSelectOptions(config.endCondition.timeLimitSeconds)
      : getTimeLimitSecondsSelectOptions(
          createDefaultTimeLimitEndCondition().timeLimitSeconds,
        );
  const answerChoiceValues = useMemo(
    () => getDistanceAnswerChoices(config),
    [config],
  );
  const summary = session.summary ?? buildDistanceGuestSummary(session.results);
  const recentResults = useMemo(
    () => session.results.slice(-3).reverse(),
    [session.results],
  );
  const cannotSaveBecauseNoAnswers =
    session.phase === "result" && session.results.length === 0;
  const intervalNotationStyle = settings.intervalNotationStyle;
  const formatIntervalName = (semitones: number) =>
    getIntervalLabel(semitones, intervalNotationStyle);

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
    updater: (current: DistanceTrainingConfig) => DistanceTrainingConfig,
  ) {
    hasEditedConfigRef.current = true;
    setBootstrapNotice(null);
    setPersistConfigErrorMessage(null);
    setConfig((current) => updater(current));
  }

  function handleStart() {
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
        modeLabel="距離モード"
        modeTone={getTrainingModeTone("distance")}
        questionLabel={getDistanceHeaderLabel(
          session.phase,
          session.activeQuestion,
          plannedQuestionCount,
        )}
        meta={getDistanceHeaderMeta({
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
                          .value as DistanceTrainingConfig["directionMode"],
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
                          .value as DistanceTrainingConfig["baseNoteMode"],
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
              <Field label="音程表記の粒度">
                <select
                  className="ui-select"
                  onChange={(event) =>
                    updateConfig((current) => ({
                      ...current,
                      intervalGranularity: event.target
                        .value as DistanceTrainingConfig["intervalGranularity"],
                    }))
                  }
                  value={config.intervalGranularity}
                >
                  <option value="simple">シンプル</option>
                  <option value="aug_dim">増減あり</option>
                </select>
              </Field>
              <div className="ui-form-chip-list">
                {answerChoiceValues.map((choice) => (
                  <Chip key={choice} tone="teal">
                    {formatIntervalName(choice)}
                  </Chip>
                ))}
              </div>
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
            <Button block onClick={handleStart} type="button" variant="primary">
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
        <DistanceQuestionPanel
          answerChoiceValues={answerChoiceValues}
          direction={session.activeQuestion.question.direction}
          intervalNotationStyle={intervalNotationStyle}
          onAnswer={session.answerQuestion}
          onReplayBase={session.replayBase}
          onReplayTarget={session.replayTarget}
          phase={session.phase}
          playbackKind={session.activeQuestion.playbackKind}
          questionIndex={session.activeQuestion.question.questionIndex}
          replayBaseCount={session.activeQuestion.replayBaseCount}
          replayTargetCount={session.activeQuestion.replayTargetCount}
        />
      ) : null}

      {session.phase === "feedback" && session.feedbackResult ? (
        <DistanceFeedbackPanel
          feedbackResult={session.feedbackResult}
          intervalNotationStyle={intervalNotationStyle}
          lastAnsweredWasFinal={session.lastAnsweredWasFinal}
          onContinue={session.continueAfterFeedback}
          onEndSession={session.endSessionManually}
          onReplayCorrectTarget={session.replayCorrectTarget}
        />
      ) : null}

      {session.phase === "result" ? (
        <DistanceResultPanel
          canSaveResult={session.canSaveResult}
          cannotSaveBecauseNoAnswers={cannotSaveBecauseNoAnswers}
          finishReason={session.finishReason}
          intervalNotationStyle={intervalNotationStyle}
          isAuthenticated={isAuthenticatedState}
          isSavePending={session.isSavePending}
          onReset={handleReset}
          onRetrySave={session.retrySaveResults}
          recentResults={recentResults}
          saveResult={session.saveResult}
          summary={summary}
        />
      ) : null}
    </AppShell>
  );
}

function getDistanceHeaderLabel(
  phase: SessionPhase,
  activeQuestion: { question: { questionIndex: number } } | null,
  plannedQuestionCount: number,
): string | undefined {
  if (phase === "result") {
    return "結果";
  }

  if (activeQuestion) {
    return `${activeQuestion.question.questionIndex + 1} / ${plannedQuestionCount}`;
  }

  return phase === "config" ? undefined : formatPhaseLabel(phase);
}

function getDistanceHeaderMeta(props: {
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
