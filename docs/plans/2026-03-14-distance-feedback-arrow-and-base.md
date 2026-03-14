# 基準音表示・矢印三角・矢印線種の改善（レビュー反映版）

## 前提・構成

距離フィードバック周辺は [distance-feedback-annotations.ts](src/app/train/distance-feedback-annotations.ts)、[distance-feedback-arrows.ts](src/app/train/distance-feedback-arrows.ts)、[distance-feedback-diagram.ts](src/app/train/distance-feedback-diagram.ts) に分割されており、描画本体は [train-ui-shared.tsx](src/app/train/train-ui-shared.tsx) の `DistanceFeedbackDiagram` に集約されている。arrow helper はすでに `direction: "forward" | "backward"`、`lane`、`tone` を返すため、**`distance-feedback-arrows.ts` は触らず、`train-ui-shared.tsx` と [globals.css](src/app/globals.css) を中心に変更する**（最小変更）。

## Goal

- 基準音のラベル・丸が画面に収まるようにする（右端で切れない）。
- 矢印先端の三角形を、矢印の長さに依存せず一定サイズにし、小さくする。
- **両方の矢印を実線にする**（現在は正解が実線・回答音が破線。両方とも実線に統一する）。

## 変更方針

### 1. 基準音が画面に収まる

- **原因**: [distance-feedback-diagram.ts](src/app/train/distance-feedback-diagram.ts) で 0〜12 の distance を生成し、`direction === "down"` のとき逆順に並べているため、基準音（distance 0）が右端列になる。右端で切れる。
- **対策**: **既存の `columnTemplate` および `minWidth`（JSX で指定している場合はそのまま）は変更せず、`.ui-distance-diagram__viewport` に内側余白（`padding-left` / `padding-right`、例: 各 8px または 12px）を追加する。** スケールの列定義は触らず、viewport のみ padding で余白を足す。

### 2. 矢印先端の三角を一定サイズ・小さく

- **原因**: 各矢印で `preserveAspectRatio="none"` の SVG を使い、その中で `<marker>` と `markerEnd` を指定しているため、線と先端が同じ座標系で伸縮し、先端三角が矢印長に引っ張られる。
- **方針**: 線と先端を分離する。線は SVG の `<line>` のみとし、`<marker>` と `markerEnd` を削除する。先端は **別要素または擬似要素** で固定ピクセル（5〜6px）とする。
  - **第一候補: 擬似要素 `.ui-distance-diagram__arrow::after`**  
    `data-tone` と `data-direction` を既存の arrow ノードに付与すれば、CSS だけで向き・色を切り替えられ、DOM を増やさずに固定サイズの三角にできる。
  - 別要素（例: `.ui-distance-diagram__arrowhead`）を追加する実装でも可。  
  計画では「別要素または擬似要素」のいずれかとし、実装者が最短手を選べるようにする。
- **実装**: [train-ui-shared.tsx](src/app/train/train-ui-shared.tsx) で各矢印の SVG から marker を削除し、矢印ラッパーに `data-direction={arrow.direction}` を追加（`data-tone` は既存）。[globals.css](src/app/globals.css) で `.ui-distance-diagram__arrow` に `position: relative` を付け、先端三角用のスタイル（擬似要素または別クラス）を定義する。

### 3. 両方の矢印を実線にする

- 現在、[globals.css](src/app/globals.css) の `.ui-distance-diagram__arrow-line[data-tone="teal"]` に `stroke-dasharray: 7 5` が指定されている。
- **対応**: 上記 `stroke-dasharray` を削除する。正解（success）・回答音（teal）とも実線になる。

## ファイル一覧（変更想定）

| ファイル | 変更内容 |
|----------|----------|
| [src/app/train/train-ui-shared.tsx](src/app/train/train-ui-shared.tsx) | 矢印: SVG から `<marker>` と `markerEnd` を削除。矢印ラッパーに `data-direction={arrow.direction}` を追加。先端は擬似要素または別要素で対応。 |
| [src/app/globals.css](src/app/globals.css) | `.ui-distance-diagram__viewport` に `padding-left` / `padding-right`。`.ui-distance-diagram__arrow` に `position: relative` と先端三角スタイル（`::after` または `.ui-distance-diagram__arrowhead`）。**teal の `stroke-dasharray` を削除（両方実線）**。 |
| [src/app/train/train-ui-shared.test.ts](src/app/train/train-ui-shared.test.ts) | 矢印の `data-direction` 付与・marker 削除・arrowhead 表現のいずれかを検証するテストを 1 本追加する前提とする。 |

## 検証

- `npm run verify`
- 基準音が右端で切れていないこと、矢印三角が一定・小型であること、**両方の矢印が実線**であることを目視確認。
