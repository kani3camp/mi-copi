# AGENTS.md

## 1. このリポジトリについて

このリポジトリは、音感トレーニングアプリ「ミーコピ」の MVP 開発用です。

プロダクトの主目的は、**耳コピにつながる相対音感トレーニング**です。
MVP は **Web アプリ** として実装し、**スマホブラウザ縦向き利用を最優先**で設計します。

開発方針は **Codex 主体** です。
人間は主に以下を担当します。

- 仕様・要件の重要判断
- 承認が必要な変更の最終判断
- 実装結果の受け入れ確認

Codex は、明示された仕様とこの AGENTS.md に従って、できるだけ自律的に実装・テスト・改善を進めてください。

---

## 2. 参照順（source of truth）

作業前に、以下の順で必ず確認してください。

1. `docs/tasks/active-task.md`
2. `docs/product/current-constraints.md`
3. `docs/product/decision-log.md`
4. `docs/product/requirements.md`
5. `docs/product/basic-design.md`
6. `docs/product/tech-stack.md`
7. この `AGENTS.md`
8. 既存コード・型・テスト

### 参照ルール
- 今回の作業対象と done は、まず `docs/tasks/active-task.md` を優先する
- 現在有効な制約は `current-constraints.md` を優先する
- 仕様変更の履歴・採用判断は `decision-log.md` を参照する
- 実装が仕様と矛盾していた場合、**既存実装ではなく仕様ファイルを優先**する
- 仕様ファイル同士で矛盾がある場合は、勝手に広げず、より新しく・より具体的な記述を優先し、そのうえで完了報告に要確認事項として残す

---

## 3. プロダクトの固定方針

以下は現時点の固定方針です。勝手に変更しないでください。

- MVP は Web アプリとして実装する
- UI / UX はスマホブラウザの縦向き利用を最優先とする
- 認証は Better Auth + Google OAuth を採用する
- DB は PostgreSQL、ORM は Drizzle ORM を採用する
- 音源は Web Audio API によりクライアント側で生成・再生する
- サーバー側で音源ファイルを大量配信する前提は採らない
- 問題出題中・回答中は DB にアクセスしない
- セッション結果は終了時にまとめて保存する
- ゲスト利用では結果保存を行わない
- UI と純粋ロジックは分離する
- 認証基盤とアプリ固有データは分離する
- MVP では過剰な API 分割を避ける
- train 画面は 1 ルート内で状態切り替えする
- スコアは内部計算・DB 保存ともに小数で扱い、小数第 3 位まで保持する
- UI 表示では必要に応じて丸める
- AI 開発では 1 タスク = 1 責務 = 1 PR を基本とする
- PR は小さく保つ

---

## 4. アーキテクチャと責務分離

このアプリは、過剰に分散しない **モジュラーモノリス** を基本とします。

想定責務は以下です。

- `auth`
- `settings`
- `training-config`
- `audio-engine`
- `question-generator`
- `answer-evaluator`
- `scoring`
- `session-recorder`
- `stats`

### 重要ルール
- 純粋ロジックは可能な限り `features/training/model` に寄せる
- UI から直接 `question generation` や `scoring` の詳細を持たせすぎない
- 訓練画面は client-heavy、設定・保存・統計・ホームは server-first を基本とする
- アプリ内部の保存・取得は、MVP では Server Actions / Server Functions 寄りでシンプルに構成する
- 不要な REST API は増やさない

---

## 5. 想定ディレクトリ方針

ディレクトリ構成は概ね以下の責務を維持してください。

```text
src/
  app/
    login/
    settings/
    stats/
    train/
      distance/
      keyboard/
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
````

### 配置ルール

* 画面固有 UI は各 feature の `components` / `ui`
* 副作用を伴う処理は `services`
* 再利用する純粋ロジックと型は `model`
* DB / auth / audio などの基盤寄りコードは `lib`
* 画面ルーティング都合の薄いロジックを `app` に増やしすぎない

---

## 6. 実装時の基本ルール

### 6.1 変更粒度

* 1 回の作業では 1 責務に集中する
* 無関係なリファクタを混ぜない
* ついで修正は最小限にとどめる
* 大きな変更が必要でも、可能なら段階的に分ける

### 6.2 仕様解釈

* 不明点があっても、勝手にスコープを広げない
* まずは現仕様の範囲で最小実装に寄せる
* 将来拡張がありそうでも、MVP の非目標は先取りしない
* 不明点が残る場合は、完了報告の「要確認事項」に明記する

### 6.3 既存コードの扱い

* 既存の命名・責務分離・型の流儀を尊重する
* ただし、既存実装が仕様とズレている場合は仕様を優先する
* 破壊的変更を避けつつ、必要なら移行しやすい形で修正する

### 6.4 UX

* 学習中のテンポを最優先する
* 回答や次問遷移のテンポを落とす処理を入れない
* 再生中ガードや二重送信防止など、操作の安定性は重視する
* スマホ縦画面での収まりを優先する

---

## 7. 人間承認が必要な変更

以下は **勝手に確定しない** でください。
実装はしてもよいですが、完了報告で必ず明示してください。

* 新しい依存ライブラリの追加
* 環境変数の追加・変更
* Better Auth / OAuth / 外部サービス設定の変更
* DB スキーマの意味変更
* migration の適用前提がある変更
* データ削除や既存データ互換性に影響する変更
* API / URL / 画面導線の大きな変更
* スコア式の意味変更
* 保存項目や分析項目の削減
* デザイン方針の大幅変更

---

## 8. 品質基準

人手レビューは最小限を前提とするため、品質は **型・テスト・CI・小さな差分** で担保します。

最低限、以下を重視してください。

* 型安全
* 既存機能を壊さないこと
* 受け入れ条件を満たすこと
* テスト可能なロジックは分離すること
* 回帰しやすい箇所にはテストを追加すること

### 優先してテストすべき対象

* 出題候補生成
* 均等出題と軽い偏り制御
* 回答判定
* スコア計算
* セッション集計
* 統計整形

### E2E smoke の重要導線

* ゲストで距離モード開始 → 1 問回答 → 結果表示
* ゲストで鍵盤モード開始 → 1 問回答 → 結果表示
* ログイン → セッション保存 → 統計表示
* 設定変更 → 再読込後も反映

---

## 9. 実行すべき検証

作業内容に応じて、以下を実行してください。

### 基本

* `pnpm typecheck`
* `pnpm lint`
* `pnpm test`

### 必要に応じて

* `pnpm build`
* `pnpm test:e2e`
* DB schema / migration の整合確認
* 変更箇所に関連する追加チェック

### 注意

* このリポジトリで実際のコマンド名が異なる場合は、`package.json` を見て正しいコマンドへ読み替える
* コマンドが未整備なら、勝手に複雑化せず、現状で実行可能な範囲を報告する

---

## 10. DB と保存まわりの注意

* 回答中に DB を触らないこと
* セッション中の進行状態はクライアント側で保持する
* 保存時は、セッション終了後にまとめて payload を組み立てる
* ログイン時のみクラウド保存する
* ゲスト時の設定はローカル保持を前提にする
* 保存データは後からスコア再計算や分析ができる粒度を保つ
* 手動再生回数は保存対象だが、MVP ではスコアに含めない

---

## 11. 実装の進め方

基本は以下の順序を意識してください。

1. まず既存コードと task を読む
2. 変更範囲を最小化して設計する
3. 必要なら先に型や純粋ロジックを整える
4. UI / 保存 / 結合部分を実装する
5. テストを追加・更新する
6. 検証コマンドを実行する
7. 完了報告をまとめる

---

## 12. 完了報告フォーマット

完了時は、必ず以下の形式で報告してください。

### 0. 【要確認】人間に確認してほしいこと

* なし / ある場合は箇条書き

### 1. 実行したコマンド一覧

* 実行コマンドを列挙

### 2. 変更したファイル一覧の要約

* 何をどう変えたかをファイル単位または責務単位で簡潔に記載

### 3. 受け入れ条件の達成状況

* 各条件ごとに達成 / 未達 / 補足を記載

### 4. 未解決リスク

* 現時点で残っている懸念や、今後の確認点

### 5. 次の bundle 候補

* 次に自然につながる小さな作業単位を 1〜3 個

### 6. コミットメッセージ案

* Conventional Commits ベースで 1 つ提案

---

## 13. 禁止事項・避けること

* 仕様にない機能を勝手に足すこと
* 大規模なついでリファクタ
* 不要な抽象化
* 不要な REST API の追加
* UI 層にビジネスロジックを埋め込みすぎること
* 回答中に DB 保存する構成への変更
* テストや型エラーを放置したまま完了扱いにすること
* 依存追加や schema 変更を黙って進めること

---

## 14. このプロジェクトで特に重視すること

* 相対音感の育成に集中する
* 耳コピにつながる体験を中心にする
* 正答率だけでなく、誤差と回答時間を重視する
* 学習テンポを崩さない
* スマホで迷いにくい UI を優先する
* 小さい差分で安全に前進する
* ChatGPT への相談を前提にしすぎず、repo 内の正本を読んで前に進む

---

## 15. TODO（人間側であとから埋める場所）

以下は repo の実態に合わせて後で更新してください。

* [ ] 実際の検証コマンド名を確定する
* [ ] `docs/product/*` を実ファイルとして配置する
* [ ] `docs/tasks/active-task.md` の運用を開始する
* [ ] `docs/dev/completion-report-template.md` を必要なら別ファイル化する
* [ ] 必要なら `.codex/skills/` を追加する

## Autonomy Policy

- Default to autonomous execution.
- Do not ask for step-by-step approval for ordinary implementation work.
- Decompose the task yourself, implement in small safe increments, run verification, and repair failures before reporting back.
- Escalate only when blocked by missing product decisions, conflicting source-of-truth documents, required approval boundaries, or repeated failed attempts.
- Prefer moving the task forward over asking unnecessary clarification questions.
- When in doubt, choose the smallest implementation that satisfies the current source of truth.
