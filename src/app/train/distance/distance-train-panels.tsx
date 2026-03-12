import type {
  DistanceGuestResult,
  DistanceGuestSummary,
} from "../../../features/training/model/distance-guest";
import {
  formatAccuracyLabel,
  formatAvgErrorLabel,
  formatResponseTimeMsLabel,
  formatScoreLabel,
} from "../../../features/training/model/format";
import {
  formatQuestionDirectionLabel,
  formatSignedSemitoneLabel,
  getIntervalLabel,
} from "../../../features/training/model/interval-notation";
import type {
  IntervalNotationStyle,
  QuestionDirection,
  SessionFinishReason,
} from "../../../features/training/model/types";
import type { SaveTrainingSessionResult } from "../../../features/training/server/saveTrainingSession";
import {
  Button,
  FieldGrid,
  KeyValueCard,
  KeyValueGrid,
  List,
  Notice,
  SectionHeader,
  Surface,
} from "../../ui/primitives";
import {
  formatFinishReasonLabel,
  getPlaybackStatusLabel,
  PlaybackIcon,
  type TrainingPlaybackKind,
  TrainingResultPersistenceSection,
} from "../train-ui-shared";

export function DistanceQuestionPanel(props: {
  phase: "playing" | "answering";
  questionIndex: number;
  direction: QuestionDirection;
  replayBaseCount: number;
  replayTargetCount: number;
  playbackKind: TrainingPlaybackKind;
  answerChoiceValues: number[];
  intervalNotationStyle: IntervalNotationStyle;
  onReplayBase: () => void;
  onReplayTarget: () => void;
  onAnswer: (value: number) => void;
}) {
  return (
    <Surface tone="accent">
      <SectionHeader
        title={`問題 ${props.questionIndex + 1}`}
        description="基準音と問題音を聞いて、音程名で回答してください。"
      />
      <div className="ui-train-status-grid">
        <KeyValueCard
          label="方向"
          value={formatQuestionDirectionLabel(props.direction)}
        />
        <KeyValueCard label="基準音の再生回数" value={props.replayBaseCount} />
        <KeyValueCard
          label="問題音の再生回数"
          value={props.replayTargetCount}
        />
      </div>

      {props.phase === "playing" ? (
        <Notice>{getPlaybackStatusLabel(props.playbackKind)}</Notice>
      ) : null}

      {props.phase === "answering" ? (
        <div className="ui-stack-md">
          <div className="ui-sticky-actions">
            <div className="ui-replay-panel">
              <div className="ui-stack-sm">
                <strong>もう一度聞く</strong>
                <span className="ui-muted">再生中の追加タップは無効です。</span>
              </div>
              <div className="ui-replay-panel__row">
                <Button
                  type="button"
                  onClick={props.onReplayBase}
                  className="ui-icon-button"
                  aria-label="基準音をもう一度聞く"
                >
                  <PlaybackIcon />
                  <span className="ui-icon-button__label">基準音</span>
                </Button>
                <Button
                  type="button"
                  onClick={props.onReplayTarget}
                  className="ui-icon-button"
                  aria-label="問題音をもう一度聞く"
                >
                  <PlaybackIcon />
                  <span className="ui-icon-button__label">問題音</span>
                </Button>
              </div>
            </div>
          </div>
          <div className="ui-train-answer-grid">
            {props.answerChoiceValues.map((choice) => (
              <Button
                key={choice}
                type="button"
                onClick={() => props.onAnswer(choice)}
                block
              >
                {getIntervalLabel(choice, props.intervalNotationStyle)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </Surface>
  );
}

export function DistanceFeedbackPanel(props: {
  feedbackResult: DistanceGuestResult;
  lastAnsweredWasFinal: boolean;
  intervalNotationStyle: IntervalNotationStyle;
  onReplayCorrectTarget: () => void;
  onContinue: () => void;
}) {
  return (
    <Surface>
      <SectionHeader title="フィードバック" />
      <Notice tone={props.feedbackResult.isCorrect ? "success" : "error"}>
        <strong>{props.feedbackResult.isCorrect ? "正解" : "不正解"}</strong>
        <div>
          {formatQuestionDirectionLabel(
            props.feedbackResult.question.direction,
          )}
        </div>
      </Notice>
      <FieldGrid>
        <KeyValueCard
          label="正解"
          value={getIntervalLabel(
            props.feedbackResult.question.distanceSemitones,
            props.intervalNotationStyle,
          )}
        />
        <KeyValueCard
          label="あなたの回答"
          value={getIntervalLabel(
            props.feedbackResult.answeredDistanceSemitones,
            props.intervalNotationStyle,
          )}
        />
      </FieldGrid>
      <KeyValueGrid>
        <KeyValueCard
          label="誤差"
          value={formatSignedSemitoneLabel(props.feedbackResult.errorSemitones)}
        />
        <KeyValueCard
          label="回答時間"
          value={formatResponseTimeMsLabel(props.feedbackResult.responseTimeMs)}
        />
        <KeyValueCard
          label="スコア"
          value={formatScoreLabel(props.feedbackResult.score)}
        />
      </KeyValueGrid>
      <div className="ui-sticky-actions">
        <Button type="button" onClick={props.onReplayCorrectTarget} block>
          正解の音をもう一度聞く
        </Button>
        <Button
          type="button"
          onClick={props.onContinue}
          variant="primary"
          block
        >
          {props.lastAnsweredWasFinal ? "結果を見る" : "次の問題へ"}
        </Button>
      </div>
    </Surface>
  );
}

export function DistanceResultPanel(props: {
  summary: DistanceGuestSummary;
  recentResults: DistanceGuestResult[];
  intervalNotationStyle: IntervalNotationStyle;
  finishReason: SessionFinishReason | null;
  isAuthenticated: boolean;
  canSaveResult: boolean;
  cannotSaveBecauseNoAnswers: boolean;
  isSavePending: boolean;
  saveResult: SaveTrainingSessionResult | null;
  onRetrySave: () => void;
  onReset: () => void;
}) {
  return (
    <Surface>
      <SectionHeader
        title="結果"
        description="今回のセッションの精度と反応速度をまとめています。"
      />
      <KeyValueGrid>
        <KeyValueCard label="回答数" value={props.summary.questionCount} />
        <KeyValueCard
          label="終了理由"
          value={formatFinishReasonLabel(props.finishReason)}
        />
        <KeyValueCard label="正解数" value={props.summary.correctCount} />
        <KeyValueCard
          label="正答率"
          value={formatAccuracyLabel(props.summary.accuracyRate)}
        />
        <KeyValueCard
          label="平均誤差"
          value={formatAvgErrorLabel(props.summary.avgErrorAbs)}
        />
        <KeyValueCard
          label="平均回答時間"
          value={formatResponseTimeMsLabel(props.summary.avgResponseTimeMs)}
        />
        <KeyValueCard
          label="セッションスコア"
          value={formatScoreLabel(props.summary.sessionScore)}
        />
      </KeyValueGrid>

      {props.recentResults.length > 0 ? (
        <div className="ui-stack-md">
          <h3 className="ui-section-title">直近の回答</h3>
          <List as="div">
            {props.recentResults.map((result) => (
              <div key={result.answeredAt} className="ui-kv-card">
                <strong>問題 {result.question.questionIndex + 1}</strong>
                <span className="ui-muted">
                  正解:{" "}
                  {getIntervalLabel(
                    result.question.distanceSemitones,
                    props.intervalNotationStyle,
                  )}
                </span>
                <span className="ui-muted">
                  回答:{" "}
                  {getIntervalLabel(
                    result.answeredDistanceSemitones,
                    props.intervalNotationStyle,
                  )}
                </span>
                <span className="ui-muted">
                  {formatSignedSemitoneLabel(result.errorSemitones)} /{" "}
                  {formatResponseTimeMsLabel(result.responseTimeMs)}
                </span>
              </div>
            ))}
          </List>
        </div>
      ) : null}

      <TrainingResultPersistenceSection
        isAuthenticated={props.isAuthenticated}
        cannotSaveBecauseNoAnswers={props.cannotSaveBecauseNoAnswers}
        canSaveResult={props.canSaveResult}
        isSavePending={props.isSavePending}
        saveResult={props.saveResult}
        onRetrySave={props.onRetrySave}
      />

      {props.finishReason === "time_up" ? (
        <Notice>
          制限時間に達したため終了しました。進行中で未回答の問題は集計から除外されています。
        </Notice>
      ) : null}

      {props.cannotSaveBecauseNoAnswers ? (
        <Notice>
          回答済みの問題がないため、このセッションは保存できません。時間に余裕を持ってもう一度お試しください。
        </Notice>
      ) : null}

      <div className="ui-sticky-actions">
        <div className="ui-stack-sm">
          <strong>次に進む</strong>
          <span className="ui-muted">
            結果を確認したら新しいセッションを始められます。
          </span>
        </div>
        <Button type="button" onClick={props.onReset} block>
          {props.cannotSaveBecauseNoAnswers
            ? "新しいセッションを始める"
            : "最初からやり直す"}
        </Button>
      </div>
    </Surface>
  );
}
