# 音感トレーニングアプリ 基本設計書 v0.2

## 1. 目的
本ドキュメントは、MVP 実装に入る前段として、要件定義と技術方針を実装可能な粒度へ落とし込むための基本設計書である。

本書では以下を扱う。

- システム構成と責務分離
- 画面 / 状態遷移
- データモデル
- 保存 / 同期方針
- API / Server Function 方針
- 音源実装の初期方針
- 実装順序とレビュー論点

## 2. 前提と設計原則

### 2.1 前提
- MVP は Web アプリとして提供する
- スマホブラウザ縦向き最優先で設計する
- 認証は Better Auth + Google OAuth を採用する
- DB は PostgreSQL、ORM は Drizzle ORM を採用する
- 音源は Web Audio API によりクライアント側で生成・再生する
- 問題出題中・回答中は DB にアクセスしない
- セッション結果は終了時にまとめて保存する
- ゲスト利用では結果保存を行わない

### 2.2 基本原則
1. 学習中のテンポを最優先する
2. UI と純粋ロジックを分離する
3. 認証基盤とアプリ固有データを分離する
4. MVP では過剰な API 分割を避ける
5. 後からスコア式や統計集計を見直せるよう、生データ寄りで保存する

## 3. システム全体像

### 3.1 構成
- フロントエンド / BFF: Next.js App Router
- 認証: Better Auth
- DB: PostgreSQL
- ORM / Migration: Drizzle ORM
- 音再生: Web Audio API
- ホスティング: Vercel
- DB リージョン: Neon Singapore

### 3.2 責務分離
アプリ内部は以下の責務に分ける。

- `auth`: 認証状態の取得、ログイン・ログアウト導線
- `settings`: 全体設定の取得・更新
- `training-config`: モード別設定の組み立てと検証
- `audio-engine`: 音生成、再生順制御、再生中ガード
- `question-generator`: 出題候補生成、均等出題、軽い偏り制御
- `answer-evaluator`: 正誤、誤差、回答内容の正規化
- `scoring`: 1問スコア / セッションスコア算出
- `session-recorder`: セッション中の一時状態保持、終了時保存 payload 組み立て
- `stats`: 統計取得、グラフ用整形

### 3.3 Server / Client 境界
#### Client 側中心
- 音声有効化
- 基準音 / 問題音の再生
- 問題進行
- 回答受付
- 回答時間計測
- 1問ごとの即時判定
- セッション中の一時記録

#### Server 側中心
- 認証状態取得
- ホーム用サマリー取得
- 設定取得 / 更新
- セッション結果保存
- 統計取得

### 3.4 画面と URL の方針
MVP では URL は必要最小限に絞る。

- `/` : ホーム
- `/login` : ログイン / ゲスト利用導線
- `/train/distance` : 距離で答えるモード
- `/train/keyboard` : 鍵盤で答えるモード
- `/stats` : 統計 / 成長確認
- `/settings` : 全体設定

補足:
- `train` ルート配下では、URL を細かく分けすぎず、1 ルート内で「設定 → 出題 → フィードバック → 結果」の表示状態を切り替える
- これにより、セッション中の一時状態をクライアント内で安全に保持しやすくする

## 4. 画面設計

## 4.1 ログイン画面 `/login`
### 目的
- Google ログインまたはゲスト利用の入口を提供する

### 主な表示要素
- Google でログイン
- ゲストで始める
- アプリ概要の短い説明

### 遷移
- ログイン成功 → `/`
- ゲスト開始 → `/`

## 4.2 ホーム画面 `/`
### 目的
- モード選択と成長確認への入口を提供する

### ログイン時表示
- 最終学習日時
- 最後に使ったモード
- 直近セッションスコア
- 直近 5 セッション基準の平均誤差 / 平均回答時間
- 距離で答えるモード開始導線
- 鍵盤で答えるモード開始導線
- 統計への導線
- 設定への導線
- ログアウト導線

### ゲスト時表示
- 距離で答えるモード開始導線
- 鍵盤で答えるモード開始導線
- ログイン導線
- 設定への導線

### 実装メモ
- ホームは server-first とし、ログイン時のみ軽量サマリーを取得する
- ゲスト時は統計関連ブロックを非表示にする

## 4.3 トレーニング画面 `/train/distance`, `/train/keyboard`
1 つのルート内で複数の表示状態を切り替える。

### 内部表示状態
- `config`: 設定入力状態
- `preparing`: 音声有効化 / 初期化中
- `playing`: 自動再生中
- `answering`: 回答待ち
- `feedback`: 1問結果表示中
- `result`: セッション結果表示中

### 状態遷移
`config -> preparing -> playing -> answering -> feedback -> (next question なら playing / 終了なら result)`

### セッション終了契機
- 問題数到達
- 制限時間到達
- ユーザーの手動終了

### 時間制セッションの扱い
- 制限時間到達時、進行中で未回答の問題は破棄する
- 完了済み問題のみを集計対象とする

### 鍵盤モードの回答表示方針
- 回答中は、基準音の鍵盤位置を視覚的に強調表示する
- この強調表示は固定基準音 / ランダム基準音の両方で適用する
- ランダム基準音でも、最初に再生した基準音がどの鍵盤かを回答中に参照できるようにする
- 問題音の正解鍵盤位置は、回答確定前には表示しない
- 基準音の視覚表示は「鍵盤音名表示 ON / OFF」とは独立した表示仕様とする
- 音名ラベルがオフでも、基準音の位置だけは分かる状態を保つ

## 4.4 統計画面 `/stats`
### 目的
- 中長期の成長を可視化する

### 表示ブロック
- 全体サマリー
  - 累計スコア
  - 全体正答率
  - 平均誤差
  - 中央誤差
  - 平均回答時間
- 直近 10 問 / 30 問サマリー
- 日次推移グラフ
  - 主グラフ: スコア
  - 補助グラフ: 誤差、回答時間
- モード切り替え
  - 全体
  - 距離で答える
  - 鍵盤で答える

### 実装方針
- ログイン必須
- MVP では期間フィルタなし
- 初期実装は都度集計ベースとし、重くなったら日次集約テーブルを後続検討する

## 4.5 設定画面 `/settings`
### 目的
- 全体設定を変更する

### 設定項目
- 全体音量
- 効果音 ON / OFF
- 音程表記スタイル
- 鍵盤音名表示 ON / OFF

### 保存方針
- 画面上は即時反映する
- ログイン時はクラウド保存する
- ゲスト時はブラウザローカルにのみ保持する

## 5. クライアント状態設計

## 5.1 セッション状態
```ts
SessionState = {
  mode: 'distance' | 'keyboard'
  phase: 'config' | 'preparing' | 'playing' | 'answering' | 'feedback' | 'result'
  config: TrainingConfig
  startedAt: number
  deadlineAt?: number
  currentQuestionIndex: number
  currentQuestion?: Question
  currentQuestionStartedAt?: number
  currentQuestionPlayableAt?: number
  answeredQuestions: QuestionResultDraft[]
  sessionScore: number
  audioReady: boolean
}
```

### 5.2 設計意図
- セッション中は DB に依存しない
- 画面更新やページ内状態遷移だけで完結できるようにする
- 保存時には `answeredQuestions` から server payload を組み立てる

## 6. ドメインモデル

## 6.1 主要な型
```ts
type TrainingMode = 'distance' | 'keyboard'
type SessionEndConditionType = 'question_count' | 'time_limit'
type SessionFinishReason = 'target_reached' | 'time_up' | 'manual_end'
type BaseNoteMode = 'fixed' | 'random'
type DirectionMode = 'up_only' | 'mixed'
type NotationStyle = 'ja' | 'abbr' | 'mixed'
type IntervalGranularity = 'simple' | 'aug_dim'
```

### 6.2 TrainingConfig
```ts
type TrainingConfig = {
  mode: TrainingMode
  intervalRange: {
    minSemitone: number
    maxSemitone: number
  }
  directionMode: DirectionMode
  includeUnison: boolean
  includeOctave: boolean
  baseNoteMode: BaseNoteMode
  fixedBaseNote?: string
  intervalGranularity?: IntervalGranularity
  endCondition: {
    type: SessionEndConditionType
    questionCount?: number
    timeLimitSeconds?: number
  }
}
```

### 6.3 Question
```ts
type Question = {
  index: number
  baseNoteName: string
  baseMidi: number
  targetNoteName: string
  targetMidi: number
  targetIntervalSemitones: number
  direction: 'up' | 'down'
  presentedAt: number
}
```

### 6.4 QuestionResultDraft
```ts
type QuestionResultDraft = {
  questionIndex: number
  answeredAt: number
  responseTimeMs: number
  answerIntervalSemitones?: number
  answerMidi?: number
  isCorrect: boolean
  errorSemitones: number
  replayBaseCount: number
  replayTargetCount: number
  score: number
}
```

## 7. 出題ロジック設計

## 7.1 出題候補生成
出題候補は `TrainingConfig` から毎問生成するのではなく、セッション開始時に有効候補集合を決定する。

### 生成ルール
- 範囲外の音程は除外する
- `includeUnison = false` のとき 0 半音を除外する
- `includeOctave = false` のとき 12 半音を除外する
- `directionMode = up_only` のとき正方向のみ採用する
- `directionMode = mixed` のとき上行 / 下行を両方採用する

### 方針補足
MVP では設定 UI の文言は要件に合わせるが、内部値は曖昧さを避けて以下に統一する。
- `up_only`: 上行のみ
- `mixed`: 上行 + 下行

※ 要件にある「下行あり」は UI 文言として扱い、内部 enum は `mixed` に正規化する。

## 7.2 基準音の扱い
- 固定基準音: ユーザー選択した 12 音を用いる
- ランダム基準音: 音名のみランダム、オクターブは固定
- オクターブは C4 付近の中音域で固定する
- MVP では内部表現として MIDI を採用する
- 鍵盤モードでは、回答中に現在問の基準音 MIDI に対応する鍵盤を UI 上で参照可能にする
- この参照表示は相対音感トレーニングの補助であり、問題音の正解鍵盤位置を事前開示しない

### 推奨初期値
- 基準オクターブ中心: C4
- 基準音 MIDI 候補: 60〜71 相当

## 7.3 均等出題と偏り制御
### 目的
- 有効候補の出題頻度をできるだけ均等にする
- 同距離の連続出題を最大 2 回までに抑える

### 実装案
- セッション内で各候補の出題回数を持つ
- 次問候補は「最少出題回数の候補群」から選ぶ
- ただし直近 2 問が同距離なら、その距離候補を一時除外する
- 除外により候補がなくなる場合は偏り制御を解除する

### MVP でやらないこと
- 成績連動の最適化出題
- 苦手音程を優先する適応制御

## 8. 回答判定設計

## 8.1 距離で答えるモード
- 回答値は `answerIntervalSemitones` として扱う
- `errorSemitones = answerIntervalSemitones - targetIntervalSemitones`
- `isCorrect = errorSemitones === 0`

## 8.2 鍵盤で答えるモード
- 回答値は `answerMidi` として扱う
- `errorSemitones = answerMidi - targetMidi`
- `isCorrect = errorSemitones === 0`

## 8.3 誤差の統一方針
誤差はモードをまたいで「正解に対して何半音高い / 低いか」の signed integer として保存する。

- 0: 正解
- +1: 半音高く回答
- -1: 半音低く回答

これにより、統計・傾向分析を共通ロジックで扱える。

## 9. スコア設計

## 9.1 基本方針
- スコア計算は小数で行う
- DB 保存も小数で行う
- UI 表示は整数へ四捨五入して表示する
- 保存時の有効桁数は小数第 3 位までとする
- DB の数値型は浮動小数ではなく fixed-scale decimal 相当を用いる
- `score_formula_version` を必ず付与し、将来の式変更に備える

## 9.2 1問スコア
基本式:

`score = roundTo3(100 * accuracyMultiplier * speedMultiplier * distanceMultiplier)`

### Accuracy multiplier
- 0 半音: 1.00
- 1 半音: 0.55
- 2 半音: 0.25
- 3 半音以上: 0.00

### Speed multiplier
- 2 秒以内: 1.20
- 4 秒以内: 1.00
- 7 秒以内: 0.85
- 7 秒超: 0.70

### Distance multiplier
- 2 度: 1.05
- 3 度: 1.10
- 4 度: 1.18
- 5 度: 1.26
- 6 度: 1.36
- 7 度: 1.48
- 8 度: 1.60

※ `targetIntervalSemitones` から difficulty bucket へ落とす詳細対応は `docs/implementation/scoring.md` を正本とする。

### 実装ルール
- 内部計算結果は小数で保持する
- 保存時に小数第 3 位へ丸める
- `score_formula_version = 'v1'` を付与する
- UI 表示時のみ整数へ四捨五入する

## 9.3 セッションスコア
- セッションスコア = 各問題スコアの小数合計
- 保存時に小数第 3 位へ丸める
- 表示時は整数へ四捨五入する
- 平均スコア = セッションスコア / 完了問題数

## 9.4 累計スコア
- ユーザー単位で question_results または training_sessions から累積集計する
- MVP では単純累積を採用する
- 集計結果も内部では小数のまま扱い、UI 表示時に整数へ丸める

## 10. データベース設計

## 10.1 方針
- Better Auth の推奨 auth テーブルをそのまま利用する
- アプリ側で独自 `users` テーブルは作らない
- アプリ固有テーブルは Better Auth の `user.id` を参照する

## 10.2 テーブル一覧
- `training_sessions`
- `question_results`
- `user_settings`

## 10.3 training_sessions
### 役割
1 セッション全体のメタ情報と集計済みサマリーを持つ。

### カラム案
- `id` UUID PK
- `user_id` text not null
- `mode` text not null
- `started_at` timestamptz not null
- `ended_at` timestamptz not null
- `finish_reason` text not null
- `end_condition_type` text not null
- `planned_question_count` int null
- `planned_time_limit_seconds` int null
- `answered_question_count` int not null
- `correct_question_count` int not null
- `session_score` numeric\(12, 3\) not null
- `avg_score_per_question` numeric\(10, 3\) not null
- `accuracy_rate` numeric not null
- `avg_error_abs` numeric not null
- `avg_response_time_ms` numeric not null
- `score_formula_version` text not null
- `config_snapshot` jsonb not null
- `created_at` timestamptz not null
- `updated_at` timestamptz not null

### 備考
- ホームと結果画面の軽量表示を速くするため、サマリー列を持つ
- 詳細分析は question_results を参照する

## 10.4 question_results
### 役割
1 問ごとの結果と分析元データを持つ。

### カラム案
- `id` UUID PK
- `session_id` UUID not null
- `user_id` text not null
- `question_index` int not null
- `answered_at` timestamptz not null
- `mode` text not null
- `base_note_name` text not null
- `base_midi` int not null
- `target_note_name` text not null
- `target_midi` int not null
- `answer_note_name` text null
- `answer_midi` int null
- `target_interval_semitones` int not null
- `answer_interval_semitones` int null
- `direction` text not null
- `is_correct` boolean not null
- `error_semitones` int not null
- `response_time_ms` int not null
- `replay_base_count` int not null
- `replay_target_count` int not null
- `score` numeric(10, 3) not null
- `score_formula_version` text not null
- `created_at` timestamptz not null

### 制約案
- `unique(session_id, question_index)`
- `response_time_ms >= 0`
- `replay_base_count >= 0`
- `replay_target_count >= 0`

### 備考
- question_results 単体でも統計算出できるように、`user_id`, `mode`, `score_formula_version` を持つ
- 設定スナップショットは session 側に持ち、question_results とは session_id で結ぶ

## 10.5 user_settings
### 役割
ユーザーの全体設定とモード別の前回設定を保持する。

### カラム案
- `user_id` text PK
- `master_volume` int not null
- `sound_effects_enabled` boolean not null
- `notation_style` text not null
- `keyboard_note_labels_enabled` boolean not null
- `last_distance_config` jsonb not null
- `last_keyboard_config` jsonb not null
- `created_at` timestamptz not null
- `updated_at` timestamptz not null

### 備考
- MVP では `last_*_config` を JSONB で保持し、モード設定保持をシンプルに実現する
- 将来、設定項目が増えて分析が必要になれば別テーブルへ分離を検討する

## 10.6 インデックス案
### training_sessions
- `(user_id, ended_at desc)`
- `(user_id, mode, ended_at desc)`

### question_results
- `(user_id, answered_at desc)`
- `(user_id, mode, answered_at desc)`
- `(session_id, question_index)`
- `(user_id, target_interval_semitones)`
- `(user_id, direction)`

## 11. 保存 / 同期設計

## 11.1 セッション保存
### ゲスト利用
- 保存しない
- セッション結果は画面上のみ表示する
- ログイン後の遡り保存はしない

### ログイン利用
- セッション終了時に一括保存する
- 保存単位は `training_sessions 1 件 + question_results 複数件`
- DB 書き込みは単一トランザクションで行う

## 11.2 設定保存
### ログイン時
- 画面上は即時反映
- 保存処理は非同期
- 最新値のみが最終的に残るよう、同一画面内では直列更新する

### ゲスト時
- `localStorage` に保存
- ログイン後へ自動移行はしない

## 11.3 保存失敗時の扱い
### セッション保存失敗
- 結果画面には表示する
- 「保存に失敗しました。再読み込み前にもう一度保存を試してください。」を表示する
- 結果 payload を一時的にブラウザメモリまたは sessionStorage に保持し、再試行ボタンを出す

### 設定保存失敗
- UI 表示値は維持する
- 小さなトーストまたはインライン文言で失敗を通知する
- 直近値で再試行できる状態を保つ

## 12. API / Server Function 設計

## 12.1 基本方針
- 認証コールバック等の外部入口以外は、Server Actions / Server Functions を優先する
- REST API を乱立させない

## 12.2 想定する主要関数
### auth
- `getCurrentUser()`
- `signInWithGoogle()`
- `signOut()`

### home
- `getHomeSummary()`

### settings
- `getUserSettings()`
- `updateUserSettings(input)`

### training
- `getInitialTrainingConfig()`
- `saveTrainingSession(input)`

### stats
- `getStatsOverview(input?)`
- `getRecentQuestionTrends(input?)`
- `getDailyTrends(input?)`

## 12.3 saveTrainingSession input
```ts
type SaveTrainingSessionInput = {
  config: TrainingConfig
  startedAt: string
  endedAt: string
  finishReason: 'target_reached' | 'time_up' | 'manual_end'
  endCondition: {
    type: 'question_count' | 'time_limit'
    questionCount?: number
    timeLimitSeconds?: number
  }
  summary: {
    plannedQuestionCount?: number
    answeredQuestionCount: number
    correctQuestionCount: number
    sessionScore: number
    avgScorePerQuestion: number
    accuracyRate: number
    avgErrorAbs: number
    avgResponseTimeMs: number
  }
  results: Array<{
    questionIndex: number
    presentedAt: string
    answeredAt: string
    mode: 'distance' | 'keyboard'
    baseNoteName: string
    baseMidi: number
    targetNoteName: string
    targetMidi: number
    answerNoteName: string
    answerMidi: number
    targetIntervalSemitones: number
    answerIntervalSemitones: number
    direction: 'up' | 'down'
    isCorrect: boolean
    errorSemitones: number
    responseTimeMs: number
    replayBaseCount: number
    replayTargetCount: number
    score: number
    scoreFormulaVersion: 'v1'
  }>
}
```

## 13. 統計設計

## 13.1 MVP の集計単位
### セッション単位
- セッションスコア
- 正答率
- 平均誤差
- 平均回答時間

### 問題単位
- 直近 10 問 / 30 問推移
- 音程別成績
- 上行 / 下行別成績
- 高め / 低めに外す傾向

## 13.2 MVP の集計方針
- ホーム: training_sessions のサマリー列を利用
- 統計画面上部: question_results を集計
- 直近 10 / 30 問: answered_at desc で取得
- 日次推移: `date(answered_at)` 単位で group by

## 13.3 集計レスポンスのイメージ
```ts
type StatsOverview = {
  totalScore: number
  totalAccuracyRate: number
  avgErrorAbs: number
  medianErrorAbs: number
  avgResponseTimeMs: number
  recent10: TrendSummary
  recent30: TrendSummary
  byInterval: IntervalPerformance[]
  byDirection: DirectionPerformance[]
  errorBias: {
    higherRate: number
    lowerRate: number
  }
}
```

## 13.4 将来拡張余地
以下は MVP では未採用だが、必要なら後続で追加する。
- `daily_user_stats` 集約テーブル
- materialized view
- キャッシュ層

## 14. 音源実装設計

## 14.1 基本方針
- 音源ファイル配信は前提としない
- Web Audio API でクライアント生成する
- MVP では「ピアノらしい単純音色」を目指し、リアルなサンプリングまでは行わない

## 14.2 audio-engine の責務
- AudioContext の初期化 / resume
- MIDI -> 周波数変換
- 基準音単体再生
- 問題音単体再生
- 基準音 -> 問題音のシーケンス再生
- 再生中の二重入力ガード
- 再生終了通知

## 14.3 実装方針
### 初期実装
- Oscillator + Gain envelope を基本とする
- 単純な倍音を少量加えて、無機質すぎない音にする
- Attack / Decay / Sustain / Release を短めにし、打鍵感を出す

### 非目標
- 本格的サンプリング音源
- 音色切り替え
- リバーブ等の凝ったエフェクト

## 14.4 再生ルール
- 自動再生順は常に「基準音 -> 問題音」
- 手動再生は基準音 / 問題音を個別再生
- 再生中に押された再生操作は無視する
- 回答時間計測開始は「問題音再生終了時点」とする

## 15. ディレクトリ設計案

```text
src/
  app/
    login/
      page.tsx
    settings/
      page.tsx
    stats/
      page.tsx
    train/
      distance/
        page.tsx
      keyboard/
        page.tsx
  features/
    auth/
    settings/
    training/
      components/
      hooks/
      model/
      services/
      ui/
    stats/
  lib/
    audio/
    db/
    auth/
    shared/
```

### 補足
- `features/training/model` に純粋ロジックを寄せる
- UI から score / question generation を直接持たせない

## 16. テスト方針

## 16.1 単体テスト優先対象
- 出題候補生成
- 均等出題 + 同距離 2 連続制御
- 回答判定
- スコア計算
- セッション集計
- 統計集計整形

## 16.2 E2E smoke test
- ゲストで距離モード開始 -> 1問回答 -> 結果表示
- ゲストで鍵盤モード開始 -> 1問回答 -> 結果表示
- ログイン -> セッション保存 -> 統計表示
- 設定変更 -> 再読込後も反映

## 17. 実装順序

### Step 1
- Better Auth 導入
- DB / Drizzle 初期設定
- user_settings / training_sessions / question_results スキーマ作成

### Step 2
- audio-engine 実装
- training-config / question-generator / answer-evaluator / scoring 実装
- 単体テスト整備

### Step 3
- 距離モード画面をゲスト利用で通す
- 設定 -> 出題 -> フィードバック -> 結果

### Step 4
- 鍵盤モード画面をゲスト利用で通す

### Step 5
- ログイン時の設定保存 / セッション保存
- ホームサマリー表示

### Step 6
- 統計画面
- 音程別 / 方向別 / 日次推移

## 18. レビュー依頼したい論点
以下は実装前にユーザーレビューをもらいたい。

### 18.1 必須レビュー
### 18.1 必須レビュー
主要論点のレビューは完了し、以下を採用決定とする。

1. `user_settings` に `last_distance_config`, `last_keyboard_config` を JSONB で保持する
2. 設定UIは即時反映し、クラウド保存は操作完了時に行う
3. 統計は MVP では都度集計ベースで開始する
4. `train` ルートは 1 URL 内で状態切り替えを行う
5. 音源は Web Audio API による聞き取りやすい単純音色で開始する
6. スコアは内部計算・DB保存ともに小数とし、小数第 3 位まで保持する

### 18.2 任意レビュー
3. **session summary の冗長保存**
   - `training_sessions` に平均誤差や平均時間を持たせるか
   - 本原案ではホーム高速化のため保持している

## 19. 現時点の採用案まとめ
- Better Auth の `user.id` を親としてアプリテーブルを紐づける
- セッション中は完全 client 主体で進める
- `train` は 1 ルート内状態切り替えで構成する
- セッション終了時にまとめて保存する
- user_settings にモード別前回設定を JSONB で保持する
- 設定UIは即時反映し、クラウド保存は操作完了時に行う
- 統計は MVP では都度集計ベースで開始する
- 音源は Web Audio API による聞き取りやすい単純音色で始める
- スコアは内部計算・DB保存ともに小数とし、小数第 3 位まで保持する
- スコア表示は UI 上で整数へ四捨五入する

---
本書は v0.2 の基本設計完成版であり、次工程はテーブル定義と型定義、主要ユースケース単位の実装タスク分解とする。
