# mi-copi

ミーコピは、基準音ありの相対音感トレーニングをスマホで短く反復できる Web アプリです。MVP は単音トレーニング中心で、距離モードと鍵盤モードを実装しています。

## Read First

この repo の作業ルールと Codex / 人間の役割分担は `AGENTS.md` を先に確認してください。
仕様正本と docs の役割分担は `docs/README.md` が入口です。

実作業時の最短導線:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/product/current-constraints.md`
4. `docs/product/decision-log.md`
5. `docs/product/requirements.md`
6. `docs/product/basic-design.md`
7. 必要に応じて `docs/implementation/route-status.md` と関連実装

## Docs Map

- `docs/product/*`
  - 仕様・制約・UX 方針の正本
- `docs/implementation/*`
  - 実装ブリッジ。現在の実装見取り図は `docs/implementation/route-status.md`
- `docs/delivery/*`
  - PR 分割や受け入れ条件の補助メモ
- `docs/tasks/active-task.md`
  - いまの bundle memo。product truth ではない
- `docs/architecture/*`
  - 旧リンク互換用。canonical ではない
- `docs/plans/*`
  - 複数セッションや長時間作業用の plan

## Current Routes

- `/`
  - ホーム。ゲストでは練習入口、ログイン時は保存済みサマリーも表示
- `/login`
  - Google ログインとゲスト開始の入口
- `/train/distance`
  - 距離モード。1 URL 内で `config -> preparing -> playing -> answering -> feedback -> result`
- `/train/keyboard`
  - 鍵盤モード。距離モードと同じ進行で回答 UI が鍵盤
- `/settings`
  - 全体設定、ログイン時の last-used config 確認 / リセット
- `/stats`
  - 保存済みデータの統計表示。ゲスト時は案内表示のみ
- `/sessions/[sessionId]`
  - 保存済みセッション詳細
- `/auth-test`
  - Better Auth / 保存疎通の確認用ページ。通常の product route ではない

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

Codex 主体開発の実行境界、承認境界、報告形式は `AGENTS.md` を参照してください。
