# current-constraints

最終更新: 2026-03-11

## Product / UX
- MVP は Web アプリとして実装する
- UI / UX はスマホブラウザ縦向きを最優先とする
- 主目的は耳コピにつながる相対音感トレーニングである
- MVP は単音トレーニングを中心とし、基準音ありを前提とする
- 学習体験では正答率だけでなく、誤差と回答時間を重視する

## Tech Stack
- Frontend: Next.js App Router + TypeScript
- Auth: Better Auth + Google OAuth
- Database: PostgreSQL
- ORM: Drizzle ORM
- Audio: Web Audio API によるクライアント側生成・再生
- Hosting assumption: Vercel + Neon

## Data / Persistence
- auth 系テーブルとアプリ固有テーブルは分離する
- Better Auth の `user` を親としてアプリデータを紐づける
- 問題出題中・回答中は DB にアクセスしない
- セッション中の進行状態はクライアント側で保持する
- セッション結果は終了時にまとめて保存する
- ゲスト利用では結果保存しない
- ゲスト結果の後保存・ログイン後バックフィルは行わない
- スコアは内部計算・DB保存ともに小数で扱い、小数第3位まで保持する
- 表示時のみ必要に応じて丸める

## App Design
- train 画面はルート内の状態切り替えで進行する
- UI と純粋ロジックは分離する
- 純粋ロジックは `features/training/model` に寄せる
- training は client-heavy、保存・設定・統計・ホームは server-first を基本とする
- アプリ内部の保存・取得は Server Actions / Server Functions 寄りで構成する
- 不要な REST API は増やさない
- 過剰な分散を避け、モジュラーモノリスを基本とする

## AI Development Rules
- Codex 主体で進める
- 1タスク = 1責務 = 1PR を基本とする
- PR は小さく保つ
- 品質は受け入れ条件・型・テスト・CI で担保する
- 人間確認が必要なのは以下のみ:
  - 依存追加
  - 環境変数追加 / 変更
  - schema の意味変更
  - migration 適用
  - 外部サービス設定変更