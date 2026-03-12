# Route Status

このファイルは「現在の実装見取り図」です。
仕様や UX の正本は引き続き `docs/product/*` を参照してください。

## Read This With

- `docs/product/current-constraints.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/tasks/active-task.md`

## Route Snapshot

### `/`
- Status: implemented
- Purpose: ホーム。練習開始の入口
- Current behavior:
  - ゲスト時は距離 / 鍵盤モードとログイン導線を表示
  - ログイン時は保存済みセッション数、最近の平均誤差 / 回答時間、最近のセッション一覧を表示
  - 保存済みセッション詳細への導線を持つ

### `/login`
- Status: implemented
- Purpose: Google ログインとゲスト開始の入口
- Current behavior:
  - Google OAuth 開始ボタンを提供
  - ゲスト利用はホームへ戻る導線で開始
  - サインイン済みなら current user を表示

### `/settings`
- Status: implemented
- Purpose: 全体設定と last-used config の確認
- Current behavior:
  - 全体設定はゲスト時はブラウザ local storage、ログイン時は `user_settings` に保存
  - ログイン時は距離 / 鍵盤それぞれの last-used config を表示
  - Settings から各モードの last-used config を初期値に戻せる
  - ゲスト時は保存済み設定の案内のみ表示

### `/stats`
- Status: implemented
- Purpose: 保存済み学習データの read-only 集計表示
- Current behavior:
  - ログイン時のみ実データを表示
  - 全体概要、モード別集計、直近 10 / 30 問、日次推移、音程別、方向別、回答傾向、最近のセッションを表示
  - ゲスト時は保存不可の notice を表示

### `/train/distance`
- Status: implemented
- Purpose: 音程名で答えるトレーニング
- Current behavior:
  - 1 URL 内で `config -> preparing -> playing -> answering -> feedback -> result`
  - `question_count` と `time_limit` の終了条件を持つ
  - replay は base / target 個別、回答時間に含まれる
  - 結果画面でログイン時のみ自動保存を試行し、失敗時は retry 可能
  - ログイン時のみ result 到達後に last-used config を保存

### `/train/keyboard`
- Status: implemented
- Purpose: 鍵盤で target note を答えるトレーニング
- Current behavior:
  - 距離モードと同じ phase 構成
  - 回答 UI は 12 音の on-screen keyboard
  - 保存、time-limit、last-used config の扱いは距離モードと同じ

### `/sessions/[sessionId]`
- Status: implemented
- Purpose: 保存済みセッション詳細の確認
- Current behavior:
  - ログイン中の本人データだけ読める
  - セッション概要、config snapshot、各回答結果を表示
  - `sessionId` が不正、または他人のデータなら表示しない

### `/auth-test`
- Status: implemented as developer utility
- Purpose: Better Auth / 保存疎通確認
- Current behavior:
  - current user 表示
  - ダミーセッション保存の動作確認
- Note:
  - product route ではなく検証用ページ

## Persistence Snapshot

### Guest
- セッション結果は保存しない
- 後ログインでの backfill はしない
- 全体設定は browser local storage のみ
- last-used training config は保存しない

### Signed-In
- セッション結果は result 画面で 1 回まとめて保存する
- `training_sessions` と `question_results` を使って home / stats / session detail を表示する
- 全体設定は `user_settings` に保存する
- last-used training config は `distance` と `keyboard` を分けて保存する

## Notes For Codex

- `docs/product/*` は「どうあるべきか」の正本
- このファイルは「いま何が実装されているか」の要約
- 型 / persistence contract の精密確認は関連コードを優先する
- `/auth-test` のような検証用 route を product scope と混同しない
