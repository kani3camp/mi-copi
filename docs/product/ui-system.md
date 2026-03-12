# UI System

Canonical source:
- This document defines shared UI/UX criteria for humans and Codex.
- Product scope still comes from `docs/product/requirements.md` and `docs/product/basic-design.md`.
- This file bridges product intent to implementable UI rules and initial design tokens.

Related docs:
- `docs/product/current-constraints.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/product/tech-stack.md`
- `docs/implementation/ts-types.md`

This document decides:
- UI reference hierarchy
- cross-screen UX principles
- initial design token direction

This document does not decide:
- exact component file structure
- unapproved library additions
- final copywriting for each screen

## Product Baseline

- MVP is a web app.
- Smartphone browser portrait is the top priority.
- The app is an ear-copy-oriented relative-pitch trainer, not a game.
- Training flow must preserve tempo: `reference -> target -> answer -> feedback`.
- Training screens are client-heavy.
- Home, settings, stats, and result screens are server-first by default.

## Reference Hierarchy

### 1. Product Docs

When a UI idea conflicts with product docs, product docs win.

### 2. Apple HIG

Apple Human Interface Guidelines are the primary visual and interaction reference.
Use them for:

- calm hierarchy
- spacing rhythm
- navigation clarity
- touch-first information density

### 3. WCAG 2.2

WCAG 2.2 is the non-negotiable quality floor.
At minimum:

- keep sufficient contrast
- keep 44px-class touch targets where practical
- make focus visible
- do not communicate state by color alone
- keep labels explicit

### 4. Material 3

Material 3 is a secondary reference for component taxonomy and state patterns.
Use it for:

- choosing between chips, segments, tabs, switches, and sheets
- state and density vocabulary

Do not treat Material 3 as the main visual style.

### 5. Design Tokens

Design tokens are the implementation bridge between reference UI and shipped UI.
Tokens should be the first place to encode color, spacing, radius, typography, and motion decisions.

### 6. shadcn-ui + Radix

shadcn-ui and Radix are implementation references, not the visual source of truth.

- It is acceptable to translate approved UI into repo-owned components using shadcn-style structure and Radix primitives.
- Do not copy default shadcn visuals as-is.
- Do not assume these dependencies are already fixed by this document alone.

## Mi-Copi UI Principles

- Prioritize learning tempo over decoration.
- Keep the screen readable without explanatory paragraphs.
- Make score, error, and response time easy to scan.
- Aim for calm, trustworthy, slightly premium UI.
- Stay clearly non-gaming and non-neon.

## Screen Family Guidance

### Training

- Keep one-screen focus and strong bottom-reach interaction.
- Make replay, progress, answer UI, and next action visually primary.
- Avoid dense chrome, large hero areas, or ornamental backgrounds.

### Home / Settings / Stats / Result

- Prefer stacked cards and clear section hierarchy.
- Let metrics be visually strong, but keep supporting text short.
- Use charts and summaries sparingly; the UI should feel like a habit app, not a BI dashboard.

## Initial Token Direction

The initial token set is descriptive source-of-truth guidance for implementation.
It should be translated into CSS variables or Tailwind tokens in the relevant implementation bundle.

### Color

```css
:root {
  --color-bg: #f6f7f5;
  --color-bg-subtle: #eef1ed;
  --color-surface: #ffffff;
  --color-surface-muted: #f3f5f2;
  --color-border: #d9ded8;
  --color-text: #172019;
  --color-text-muted: #5f6b61;
  --color-primary: #4e8f63;
  --color-primary-hover: #437c55;
  --color-primary-soft: #e7f1ea;
  --color-success: #3f8f5a;
  --color-warning: #b9852f;
  --color-danger: #b85c4c;
  --color-chart-primary: #5e9d6e;
  --color-chart-secondary: #a9c9b1;
}
```

### Radius

```css
:root {
  --radius-xs: 8px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}
```

### Spacing

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

### Typography

```css
:root {
  --font-display-size: 32px;
  --font-h1-size: 24px;
  --font-h2-size: 20px;
  --font-title-size: 18px;
  --font-body-size: 15px;
  --font-body-sm-size: 13px;
  --font-label-size: 12px;
  --font-metric-size: 30px;
}
```

### Motion

```css
:root {
  --motion-fast: 120ms;
  --motion-base: 180ms;
  --motion-slow: 260ms;
  --motion-easing: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

## Implementation Rules

- Keep UI logic and pure training logic separate.
- Put reusable visual primitives behind repo-owned components.
- Treat tokens as the first customization layer before adding bespoke one-off styling.
- Keep training interactions responsive even if surrounding pages are server-first.

## Intentionally Out Of Scope

- dark theme rules
- final chart library choice
- icon-package choice
- image-generation prompt templates
