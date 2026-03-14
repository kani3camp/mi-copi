"use client";

import { useCallback, useReducer, useRef, useState } from "react";

import { useGlobalUserSettings } from "../../../features/settings/client/global-user-settings-provider";
import { useTrainingSessionCore } from "../../../features/training/client/use-training-session-core";
import { TRAINING_CONFIG_LIMITS } from "../../../features/training/model/config";
import { getTrainingModeTone } from "../../../features/training/model/format";
import { formatDirectionModeLabel } from "../../../features/training/model/interval-notation";
import { distanceTrainingSessionAdapter } from "../../../features/training/model/modes/distance-session-adapter";
import type {
  DistanceTrainingConfig,
  NoteClass,
  SaveTrainingSessionInput,
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
import {
  type DistanceTrainingConfigAction,
  reduceDistanceTrainingConfig,
} from "../training-config-form-state";
import { TrainingProgressHeader } from "../training-page-shell";
import { useTrainingRouteBootstrap } from "../training-route-bootstrap";
import {
  DistanceFeedbackPanel,
  DistanceQuestionPanel,
  DistanceResultPanel,
} from "./distance-train-panels";
import { buildDistanceTrainViewModel } from "./distance-train-presenter";

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

  function dispatchConfigAction(action: DistanceTrainingConfigAction) {
    bootstrap.handleConfigEdit();
    setPersistConfigErrorMessage(null);
    dispatchConfig(action);
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
              <Field label="音程表記の粒度">
                <select
                  className="ui-select"
                  onChange={(event) =>
                    dispatchConfigAction({
                      type: "set_interval_granularity",
                      value:
                        event.target.value === "aug_dim" ? "aug_dim" : "simple",
                    })
                  }
                  value={config.intervalGranularity}
                >
                  <option value="simple">シンプル</option>
                  <option value="aug_dim">増減あり</option>
                </select>
              </Field>
              <div className="ui-form-chip-list">
                {viewModel.answerChoiceChips.map((choice) => (
                  <Chip key={choice.value} tone="teal">
                    {choice.label}
                  </Chip>
                ))}
              </div>
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
          answerChoiceValues={viewModel.answerChoiceValues}
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
          onEndSession={session.endSessionManually}
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
