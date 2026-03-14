# 距離モード フィードバック図 実装ブリーフ

## 1. Background

### 何が壊れているか

- 距離モードのフィードバック図で**表示崩れ**が発生している。
- 特に**縦ラベル（「正解」「回答」「基準音」）がわずかに右寄りに見える**問題がある。
- 矢印・丸・アノテーションの位置が CSS / absolute 配置 / `writing-mode` に強く依存しており、ブラウザや幅によって再現しやすい。

### なぜ今の修正方法が不安定か

- レイアウトが **CSS Grid + position: absolute + 擬似要素** の組み合わせで成り立っており、**幾何情報（列幅・行高・ラベル位置）と見た目が一体化**している。
- 縦書きラベルは **`writing-mode: vertical-rl` + `text-orientation: upright`** に依存しており、フォントや環境で見た目がぶれやすい。
- 図の**単体検証**が Storybook では Panel 単位のみで、diagram だけを幅・ケース別に確認するストーリーがなく、**場当たり的な CSS 調整**になりがち。
- 過去の修正（viewport padding、矢印先端の擬似要素など）が **geometry とスタイルの境界なし** で積み重なり、変更の影響範囲が読みにくい。

---

## 2. Goal

- **描画責務を分離**し、**図のレイアウトを計算で決め、描画は単一座標系で行う**ことで、レイアウト崩れを再発しにくくする。
- **Diagram 単体**を Storybook で幅・ケース別に検証できるようにし、実機確認に依存しない開発サイクルを可能にする。
- **縦ラベル**は `writing-mode` の見た目依存を減らし、位置・向きを制御可能にする。
- **DistanceFeedbackPanel の外部 API（props・配置）は極力維持**し、呼び出し側の変更を最小にする。

---

## 3. Scope

### 変更対象

- 距離フィードバック**図（diagram）**のレイアウトモデルと描画実装。
- 図の入力となる steps / annotations / arrows を返す **pure な layout 関数**の整理・拡張。
- 図の**描画**：CSS 主体の寄せ集めから、**SVG ベースの単一座標系**を第一候補にした実装。
- **Storybook**：diagram 単体のストーリー追加（exact match / close miss / base / edge / narrow width 等）。
- 縦ラベルの表現方法（SVG text または回転付き HTML で geometry を明示）。

### 変更しない対象

- **DistanceFeedbackPanel** の props と子要素の並び（SummaryBlock、Button 等）。Panel は `DistanceFeedbackDiagram` に `direction` / `correctSemitones` / `answeredSemitones` を渡す現状の形を維持。
- セッション進行・採点ロジック・永続化・距離モードの他 UI（出題パネル・結果パネル等）。
- `getDistanceFeedbackStatus`（「完全一致」「惜しい」「ずれあり」）の仕様。
- `buildDistanceFeedbackDiagramSteps` / `buildDistanceFeedbackDiagramAnnotations` / `buildDistanceFeedbackDiagramArrows` の**外部インターフェース（引数・返り値の意味）**は維持し、必要に応じて中身を pure な layout モデルに寄せる。

---

## 4. Proposed Design

### 4.1 Layout model の pure function 化

- **入力**: `direction`, `correctSemitones`, `answeredSemitones`（現行と同じ）。
- **出力**: 描画に必要な**座標・寸法を含む中間表現**を返す一連の pure 関数に整理する。
  - 既存の `buildDistanceFeedbackDiagramSteps` / `buildDistanceFeedbackDiagramAnnotations` / `buildDistanceFeedbackDiagramArrows` を、**SVG や固定幅前提の「列インデックス」「レーン」「距離」**を返すようにし、必要なら **layout 専用の型**（例: 列幅・行高・ラベル矩形・矢印の始点終点を数値で持つ）を新規に用意する。
- **座標系**: 図の論理幅（列数）と論理高さ（レーン数・アノテーション行など）を定数または入力から算出し、**ピクセルは renderer が viewBox または固定サイズにマッピング**する。CSS の `minmax(0, 1fr)` に頼らず、**列幅は layout 関数の出力**とする。

### 4.2 Diagram renderer の SVG 化

- **第一候補**: 図全体を **1 つの SVG** で描画する。
  - スケール（0..12 の列）、矢印（2 本）、基準音の丸、アノテーション（正解・回答・基準音）を **同一の viewBox 座標系**で配置する。
  - 矢印は `<line>` + `<polygon>`（先端）または `<path>` で描く。色・破線は属性で指定し、CSS は色・stroke 程度に限定する。
- **メリット**: 拡大縮小・幅変更に強く、**geometry が JS/TS の数値で明示**される。Storybook で viewBox を固定すれば再現性が高い。
- **代替**: どうしても HTML を残す場合は、**ラッパーは 1 コンテナ**にし、内部の位置・サイズは **layout 関数が返す数値** で `style` に注入する（absolute の left/top/width/height を layout から渡す）。その場合でも、**CSS は geometry を決めない**方針とする。

### 4.3 縦ラベルの扱い

- **方針**: `writing-mode` の見た目依存を減らす。
  - **SVG 採用時**: `<text>` で描画し、`transform="rotate(-90)"` などで縦書きを**座標で制御**する。または 1 文字ずつ縦に並べる。
  - **HTML 残す場合**: ラベル位置を **layout 関数が「列インデックス → x 座標」で返す**ようにし、`writing-mode` は補助に留め、**中央揃えは transform や left/top で明示**する。
- 目標: 「正解」「回答」「基準音」が**列の中央に安定して揃う**こと。右寄りに見える原因を「中央揃えの基準が曖昧」にしない。

### 4.4 CSS を geometry から切り離す方針

- **Geometry（どこに何を置くか）**: layout 関数の返り値と renderer の座標計算で決める。**CSS の grid-template-columns / position / inset で列・行の位置を決めない**。
- **CSS の役割**: 色、フォントサイズ、角丸、枠線、シャドウなど**見た目のみ**。必要なら **layout が返す値** を style に渡す（幅・高さ・位置）。
- 既存の `.ui-distance-diagram__*` は、SVG 化後は **SVG 要素用のクラス** に整理し、grid/absolute によるレイアウトは廃止する。

### 4.5 Exact match 時の表示整理方針

- 正解と回答が同じ距離（exact match）のとき、**同一列に「正解」「回答」が両方出る**現状の仕様は維持する。
- 表示上は **2 つのラベルを縦に積む**か、**1 列内で横に並べる**かを layout モデルで明示する（例: annotation の `stackIndex` や Y オフセットを layout が返す）。
- どちらにしても **layout 関数が「この列に何をどこに描くか」を一意に返す**形にし、CSS の `annotation-stack` の曖昧な積み方に頼らない。

---

## 5. Target Files

### 既存で触る可能性が高いファイル

- `src/app/train/distance-feedback-diagram.ts` — steps の生成。必要なら layout 用の型・座標計算をここに寄せる。
- `src/app/train/distance-feedback-arrows.ts` — 矢印の列範囲・方向。SVG 用に始点終点の論理座標を返す拡張の可能性。
- `src/app/train/distance-feedback-annotations.ts` — アノテーション一覧。layout が「列インデックス + オフセット」を返すようにする場合に拡張。
- `src/app/train/train-ui-shared.tsx` — `DistanceFeedbackDiagram` の実装。現行の Grid/HTML を SVG ベースに差し替える、または layout の数値を style に流す。
- `src/app/globals.css` — `.ui-distance-diagram__*` を、geometry をやめ見た目用に整理。SVG 化後は削減が主。

### 新規追加候補

- `src/app/train/distance-feedback-layout.ts` — 列幅・行高・ラベル矩形・矢印の始点終点など、**描画用の座標・寸法を返す pure 関数**をまとめる。
- `src/app/train/distance-feedback-diagram.stories.tsx`（または `train-ui-shared.stories.tsx` 内）— **DistanceFeedbackDiagram 単体**のストーリー（後述ケース）。

---

## 6. Storybook Cases

Diagram 単体で、少なくとも以下のケースを用意する。

| ケース | 内容 |
|--------|------|
| **Exact match** | `correctSemitones === answeredSemitones`（例: 2, 2）。同一列に正解・回答の両ラベル。 |
| **Close miss higher** | 回答が正解より 1 半音上（例: 正解 5・回答 6）。 |
| **Close miss lower** | 回答が正解より 1 半音下（例: 正解 5・回答 4）。 |
| **Answer at base** | 回答が基準音（answeredSemitones === 0）。正解は 0 以外（例: 3）。 |
| **Edge / boundary** | 最大距離（正解 12・回答 11 など）、または direction down で 0 が右端になるケース。 |
| **Narrow mobile width** | コンテナ幅を 320px 程度に制限し、図がはみ出さず・ラベルが切れないこと。 |

これらは **DistanceFeedbackDiagram** に `direction` / `correctSemitones` / `answeredSemitones` を直接渡すストーリーとする。Panel 経由ではなく diagram 単体で壊れやすいパターンを検証する。

---

## 7. Acceptance Criteria

- **レイアウト**: 図の列・矢印・丸・ラベルの位置が **layout 関数の出力（または SVG の viewBox 座標）で一意に決まり**、CSS の grid/absolute に依存しない。
- **縦ラベル**: 「正解」「回答」「基準音」が **列の中央に安定して揃い**、writing-mode のみに依存しない表現になっている。
- **Exact match**: 同一距離で正解・回答が両方表示され、重なり・はみ出しがない。
- **Storybook**: 上記 6 ケースを diagram 単体ストーリーで用意し、**narrow 幅を含めて視覚確認**できる。
- **検証**: `npm run verify` が通る。既存の `train-ui-shared.test.ts` の steps/annotations/arrows のテストは維持（インターフェース互換）。
- **Panel**: `DistanceFeedbackPanel` は従来どおり `DistanceFeedbackDiagram` を 1 つ使い、props の変更は不要（または最小限）。

---

## References

- 既存計画: `docs/plans/2026-03-14-distance-feedback-display.md`, `docs/plans/2026-03-14-distance-feedback-arrow-and-base.md`
- 描画: `src/app/train/train-ui-shared.tsx`（`DistanceFeedbackDiagram`）, `src/app/globals.css`（`.ui-distance-diagram__*`）
- モデル: `distance-feedback-diagram.ts`, `distance-feedback-arrows.ts`, `distance-feedback-annotations.ts`
