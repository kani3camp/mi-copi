# Route Status

このファイルは route 単位の「現在の実装見取り図」です。仕様と UX の正本は引き続き `docs/product/*` を参照してください。

## Read This With

- `docs/product/current-constraints.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- 関連する current route code

## Route Snapshot

### `/`
- Status: implemented
- Purpose: ホーム。次の練習開始と保存済み成長確認の入口
- Current behavior:
  - ゲスト時は距離 / 鍵盤モード開始とログイン導線を表示
  - ログイン時は最終学習日時、最後に使ったモード、最近の平均誤差 / 回答時間、最近の保存済みセッション一覧を表示
  - 保存済みセッション詳細と統計への導線を持つ

### `/login`
- Status: implemented
- Purpose: Google ログインとゲスト利用の入口
- Current behavior:
  - Google OAuth 開始 UI を提供
  - ゲストでもそのまま練習を始められる案内を出す
  - サインイン済みなら current user の名前とメールアドレスを表示

### `/settings`
- Status: implemented
- Purpose: 全体設定と last-used config の確認 / リセット
- Current behavior:
  - 全体設定はゲスト時は browser local storage、ログイン時は `user_settings` に保存する
  - ログイン時は距離 / 鍵盤それぞれの last-used config と更新時刻を表示する
  - 各モードの last-used config を初期値に戻せる
  - ゲスト時は保存済み設定がクラウド連携されない案内のみ表示する

### `/stats`
- Status: implemented
- Purpose: 保存済み学習データの read-only 集計表示
- Current behavior:
  - ログイン時のみ実データを表示する
  - 全体概要、スコア推移、モード別集計、直近 10 / 30 問、日次推移、音程別、方向別、最近のセッションを表示する
  - ゲスト時は保存が必要な画面であることを示す notice を表示する

### `/train/distance`
- Status: implemented
- Purpose: 音程名で答えるトレーニング
- Current behavior:
  - 1 URL 内で `config -> preparing -> playing -> answering -> feedback -> result`
  - `question_count` と `time_limit` の終了条件を持つ
  - replay は base / target 個別で、再生中の重複操作は無視し、回答時間にも含める
  - result 到達後、ログイン時のみ 1 セッション分をまとめて自動保存する
  - 自動保存失敗時は result 画面を維持し、retry を提供する
  - ログイン時のみ last-used config を mode 別に保存する

### `/train/keyboard`
- Status: implemented
- Purpose: 鍵盤で target note を答えるトレーニング
- Current behavior:
  - 距離モードと同じ phase 構成と終了条件を持つ
  - 回答 UI は 12 音の on-screen keyboard で、回答中は基準音の鍵盤位置を視覚表示する
  - result 到達後の自動保存、失敗時 retry、last-used config 保存の扱いは距離モードと同じ

### `/sessions/[sessionId]`
- Status: implemented
- Purpose: 保存済みセッション詳細の確認
- Current behavior:
  - ログイン中の本人データだけ読める
  - セッション概要、config snapshot、各回答結果を表示する
  - `sessionId` が不正、未保存、または他人のデータなら `notFound()` 扱いにする

### `/auth-test`
- Status: implemented as developer utility
- Purpose: Better Auth / 保存疎通確認
- Current behavior:
  - shared app shell / hero 上で開発用 utility route と明示する
  - server current user を JSON 表示する
  - client session を JSON 表示し、sign-in / sign-out / refresh を試せる
  - ダミーセッション保存の動作確認を行える
  - 未認証時の save-test notice と、操作失敗時の error notice を表示する
- Note:
  - product route ではなく、開発時の確認用ページ

## Persistence Snapshot

### Guest
- セッション結果は保存しない
- 後ログインでの backfill はしない
- 全体設定は browser local storage のみ
- last-used training config は保存しない

### Signed-In
- セッション結果は result 到達後に 1 回まとめて保存を試行する
- 保存失敗時は result 画面を維持し、ユーザーが retry できる
- `training_sessions` と `question_results` を使って home / stats / session detail を表示する
- 全体設定は `user_settings` に保存する
- last-used training config は `distance` と `keyboard` を分けて保存する

## Notes For Codex

- `docs/product/*` は「どうあるべきか」の正本
- このファイルは「いま何が実装されているか」の要約
- 型や persistence contract の精密確認は関連コードを優先する
- `/auth-test` のような検証用 route を product scope と混同しない
- 実ブラウザ QA はこの環境では未完了
  - headless Chromium が macOS permission error で起動できず、browser automation は未実施
