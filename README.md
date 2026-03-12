# mi-copi

ミーコピは、基準音ありの相対音感トレーニングをスマホで短く反復できる Web アプリです。MVP は単音トレーニング中心で、距離モードと鍵盤モードを提供します。

## Read First

この repo では `AGENTS.md` が作業ルールの入口です。仕様正本と docs の役割分担は `docs/README.md` を起点に辿ってください。

実作業時の最短導線:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/product/current-constraints.md`
4. `docs/product/decision-log.md`
5. `docs/product/requirements.md`
6. `docs/product/basic-design.md`
7. 必要に応じて `docs/implementation/route-status.md` と関連コード

## Docs Map

- `docs/product/*`
  - 仕様、制約、UX 方針の正本
- `docs/implementation/*`
  - 実装ブリッジと契約メモ
  - route 単位の現状確認は `docs/implementation/route-status.md`
- `docs/delivery/*`
  - 受け入れ条件、PR 分割、delivery 補助メモ
- `docs/tasks/active-task.md`
  - 今回進める bundle のメモ
  - product truth ではない
- `docs/plans/*`
  - 複数セッションや multi-hour 作業の plan
- `docs/architecture/*`
  - 旧リンク互換用。canonical ではない

## Current Routes

- `/`
  - ホーム。ゲストは練習入口、ログイン時は保存済みサマリーと最近のセッションを表示
- `/login`
  - Google ログインとゲスト利用の入口
- `/train/distance`
  - 距離モード。`config -> preparing -> playing -> answering -> feedback -> result` を 1 URL 内で進行
- `/train/keyboard`
  - 鍵盤モード。距離モードと同じ phase 構成で、回答 UI がオンスクリーン鍵盤
- `/settings`
  - 全体設定、ログイン時の last-used config の確認と初期値リセット
- `/stats`
  - 保存済みデータの統計表示。ゲスト時は保存案内のみ
- `/sessions/[sessionId]`
  - 保存済みセッション詳細
- `/auth-test`
  - Better Auth と保存疎通の開発者向け確認ページ

route ごとの詳細な実装見取り図は `docs/implementation/route-status.md` を参照してください。

補足:

- `docs/implementation/route-status.md` は current route behavior の要約です
- 実ブラウザ QA はこの環境では未完了です
  - headless Chromium が macOS permission error で起動できず、browser automation は未実施です

## Setup

前提:

- Node.js `>=24 <25`
- PostgreSQL
- Google OAuth を使う場合は Better Auth 用のクレデンシャル

最小手順:

1. `npm install`
2. `.env.example` を参照して環境変数を設定する
3. DB と Better Auth の前提が揃っていれば `npm run dev`

環境変数の概略:

- `DATABASE_URL`
  - PostgreSQL 接続先
- `BETTER_AUTH_SECRET`
  - Better Auth の secret
- `BETTER_AUTH_URL`
  - ローカルでは通常 `http://localhost:3000`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

詳細なキー名とダミー値は `.env.example` を参照してください。

## Verification

- `npm run format`
  - Biome の自動修正込みチェック
- `npm run lint`
  - Biome lint
- `npm run lint:repo`
  - repo 固有の静的チェック
- `npm run check`
  - Biome の read-only check
- `npm run typecheck`
  - TypeScript 型検証
- `npm run test`
  - pure model / server logic のテスト
- `npm run build`
  - Next.js build
- `npm run verify`
  - `typecheck` → `check` → `lint:repo` → `test` → `build`

日常の総合検証は `npm run verify` を基準にします。Codex 主体開発の実行境界、承認境界、報告形式は `AGENTS.md` を参照してください。
