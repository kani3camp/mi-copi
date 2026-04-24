# DESIGN.md

Canonical source:
- This document is the design source of truth for mi-copi UI implementation.
- It exists so humans and Codex can implement a consistent UI without re-deciding visual rules in each task.
- Product scope and business rules still come from `docs/product/requirements.md`, `docs/product/basic-design.md`, and `docs/product/current-constraints.md`.

Related docs:
- `docs/product/current-constraints.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/product/tech-stack.md`
- `docs/implementation/ts-types.md`

This document decides:
- visual and interaction design rules
- design tokens and semantic meaning mapping
- component-level behavior guidance
- screen-level design guidance
- implementation guardrails for UI work

This document does not decide:
- product scope or business logic
- exact component file structure
- unapproved library additions
- final copywriting for each screen

## Product Baseline

- MVP is a web app.
- Smartphone browser portrait is the top priority.
- The app is an ear-copy-oriented relative-pitch trainer, not a game.
- Training flow must preserve tempo: `reference -> target -> answer -> feedback -> next`.
- Training screens are client-heavy, including the in-route `result` phase that keeps the finished-session payload for save and retry.
- Home, settings, stats, and saved session detail/history screens are server-first by default.

## Reference Hierarchy

### 1. Product Docs

When a UI idea conflicts with product docs, product docs win.

### 2. This Document

When implementation convenience conflicts with this document, this document wins unless a human explicitly approves a deviation.

### 3. Apple HIG

Apple Human Interface Guidelines are the primary visual and interaction reference.
Use them for:

- calm hierarchy
- spacing rhythm
- navigation clarity
- touch-first information density

### 4. WCAG 2.2

WCAG 2.2 is the non-negotiable quality floor.
At minimum:

- keep sufficient contrast
- keep 44px-class touch targets where practical
- make focus visible
- do not communicate state by color alone
- keep labels explicit

### 5. Material 3

Material 3 is a secondary reference for component taxonomy and state patterns.
Use it for:

- choosing between chips, segments, tabs, switches, and sheets
- state and density vocabulary

Do not treat Material 3 as the main visual style.

### 6. Design Tokens

Design tokens are the implementation bridge between reference UI and shipped UI.
Tokens should be the first place to encode color, spacing, radius, typography, and motion decisions.

### 7. shadcn-ui + Radix

shadcn-ui and Radix are implementation references, not the visual source of truth.

- It is acceptable to translate approved UI into repo-owned components using shadcn-style structure and Radix primitives.
- Do not copy default shadcn visuals as-is.
- Do not assume these dependencies are already fixed by this document alone.

## Product-Aware Design Goals

mi-copi is not a generic music app and not a flashy game UI.
It is a relative-pitch trainer for ear-copy practice.

The UI must optimize for the following:

- smartphone portrait first
- fast training tempo
- easy understanding without long explanation text
- growth visibility through score, error, and response time
- trustworthy, modern, slightly premium feel
- green-based identity with stronger saturation than the current conservative draft, but not neon and not gaming

Core interaction loop:

`reference tone -> target tone -> answer -> feedback -> next`

Everything in the training UI should support this loop.

## Design Keywords

### Keep

- crisp
- modern
- premium
- clean
- mobile-native
- musical
- energetic
- focused

### Avoid

- dull
- corporate dashboard look
- flat grey-heavy monotony
- childish game UI
- sci-fi neon
- over-decoration
- oversized empty hero sections

### Tone

The UI should feel like:

- a high-quality learning app
- a polished music utility
- something you want to open every day

Not like:

- an admin panel
- an EDM visualizer
- a toy keyboard app

## Non-Goals

Do not optimize for the following in the initial implementation:

- desktop-first layout
- dark mode parity
- ornamental illustration-heavy design
- highly experimental motion
- brand mascot or character UI
- skeuomorphic piano realism

## Visual Direction

### Brand Direction

The main brand color remains green.
However, the green should be more confident and stylish than the earlier conservative draft.

Visual target:

- deeper emerald or vivid green as primary
- cleaner contrast with dark ink text
- brighter accent energy where needed
- premium neutral backgrounds

### Overall Mood

- bright but not washed out
- saturated enough to feel cool
- restrained enough to keep trust
- premium enough to avoid a template look

### Surface Philosophy

Use mostly calm, bright surfaces and let the green identity come through via:

- primary actions
- progress indicators
- selected states
- charts
- success states
- key highlights in training flow

Do not flood the entire app with green blocks.

## Color System

### Core Palette

```txt
Brand / Primary
- primary-800: #065F38
- primary-700: #087A49
- primary-600: #10A861
- primary-500: #19C06F
- primary-400: #43D98E
- primary-300: #79E8B2

Neutrals
- ink-950: #07130D
- ink-900: #0D1B14
- ink-800: #17241D
- ink-700: #2C3A33
- ink-600: #55635B
- ink-500: #7E8B84
- ink-400: #AEB7B2
- ink-300: #D7DEDA
- ink-200: #E9EEEB
- ink-100: #F4F7F5
- white: #FFFFFF

Support
- blue-info: #14B8D4
- amber-warn: #F59E0B
- red-danger: #EF4444
- violet-accent: #7C3AED
```

### Semantic Tokens

```txt
Backgrounds
- bg-canvas: #F4F7F5
- bg-subtle: #EDF3EF
- bg-surface: #FFFFFF
- bg-elevated: #FFFFFF
- bg-inverse: #0C1711

Text
- text-primary: #0D1B14
- text-secondary: #4E5C55
- text-muted: #738078
- text-inverse: #FFFFFF

Borders
- border-subtle: #E2E8E4
- border-default: #D3DBD6
- border-strong: #B7C4BC

Brand
- brand-solid: #087A49
- brand-hover: #065F38
- brand-soft: #E8FFF3
- brand-softer: #F2FFF7
- brand-contrast: #FFFFFF

Status
- success-solid: #22C55E
- success-soft: #EAFBF0
- warning-solid: #F59E0B
- warning-soft: #FFF6E5
- danger-solid: #EF4444
- danger-soft: #FEECEC
- info-solid: #14B8D4
- info-soft: #E8FAFD

Charts
- chart-score: #10A861
- chart-error: #7C3AED
- chart-time: #14B8D4
- chart-accuracy: #0B8A52
- chart-volume: #9FD9B7
```

### Usage Rules

- Green is the primary brand and action color.
- Use violet and cyan only as supporting analytical accents, mainly in charts and secondary emphasis.
- Warning and danger should stay clean and semantic, never decorative.
- Do not invent new brand hues without updating this document.

### Meaning Mapping

Use consistent meaning across screens:

- primary green: main CTA, current progression, selected state, headline score emphasis
- soft green: active chips, subtle highlights, keyboard reference marker background
- violet: error-related charting or analytical secondary accent
- cyan: response-time charting or technical playback notices
- amber: warning, caution, and `惜しい` support emphasis
- red: destructive, error, and failure only

## Typography

### Font Stack

```txt
Primary Latin: Inter
Primary Japanese: Noto Sans JP
Fallback: system-ui, sans-serif
```

If the implementation does not load these fonts yet, align the fallback stack as closely as practical and treat explicit font loading as a follow-up UI task rather than an implicit requirement.

### Type Scale

```txt
display-1: 40 / 48 / 700
heading-1: 30 / 38 / 700
heading-2: 24 / 32 / 700
heading-3: 20 / 28 / 650
title-1: 18 / 26 / 650
body-1: 16 / 24 / 500
body-2: 14 / 21 / 500
label-1: 13 / 18 / 600
label-2: 12 / 16 / 600
metric-xl: 44 / 44 / 700
metric-lg: 32 / 36 / 700
metric-md: 24 / 28 / 700
```

### Typography Rules

- Use larger metrics and tighter supporting labels for score-heavy UI.
- Avoid long explanatory paragraphs in training screens.
- Use strong number hierarchy for session score, average error, average response time, and progress.
- Japanese copy should remain short and clear.

## Spacing, Radius, Shadows, Motion

### Spacing

```txt
space-1: 4
space-2: 8
space-3: 12
space-4: 16
space-5: 20
space-6: 24
space-8: 32
space-10: 40
space-12: 48
```

Default card padding on mobile: `16px`
Large section gap on mobile: `24px`

### Radius

```txt
radius-xs: 8
radius-sm: 12
radius-md: 16
radius-lg: 20
radius-xl: 24
radius-full: 9999
```

Rules:

- buttons: `12-16`
- cards: `20`
- pills and segmented controls: `9999`
- keyboard highlight overlays: `10-12`

### Shadow

```txt
shadow-sm: 0 1px 2px rgba(7, 19, 13, 0.04)
shadow-md: 0 8px 24px rgba(16, 34, 24, 0.08)
shadow-lg: 0 18px 40px rgba(16, 34, 24, 0.10)
```

Rules:

- keep shadows soft
- prefer border plus subtle shadow over dramatic elevation

### Motion

```txt
motion-fast: 120ms
motion-base: 180ms
motion-slow: 240ms
motion-ease: cubic-bezier(0.2, 0.8, 0.2, 1)
```

Rules:

- motion should support clarity, not decoration
- avoid bouncy transitions
- training interactions must feel instant

## Layout Principles

### Mobile-First

All first-pass implementation decisions should optimize for smartphone portrait.
Desktop can be an adaptation, not the primary design target.

### Density

- home, stats, and settings may use stacked cards
- training screens must remain focused and compact
- avoid excessive dead space in the top half of the screen

### Reachability

On training screens, primary controls should be easy to tap with one hand.

Training priority order:

1. replay buttons
2. answer area
3. feedback next action
4. progress and meta info

## Component System

### Buttons

Primary button:

- Use for the most important action in the current context.
- Visual: solid accessible green background, white text, medium-to-bold label, subtle shadow.
- Use `brand-solid` / `brand-hover` with `brand-contrast`; do not use brighter greens with white text for normal-sized labels.
- Use for: start training, answer submit when explicit submit exists, next question, go to stats, save retry when it is the main recovery path.

Secondary button:

- Use for supportive but visible actions.
- Visual: white or subtle surface, green border and green text, soft hover tint.
- Use for: settings, replay alternatives, return home, manual session end when not destructive.

Tertiary or text button:

- Use sparingly for subordinate actions.

### Metric Card

Used for score, error, response time, and recent summary.

Structure:

- small label
- dominant metric
- supporting delta or context

Rules:

- metric must visually dominate
- supporting text must not compete
- do not overuse icons

### Segmented Control

Use for compact mutually exclusive choices.

Use for:

- stats mode switch
- distance vs keyboard summary toggles
- answer style settings where appropriate

Visual:

- pill container
- selected item = solid green or soft green with strong text
- unselected = neutral surface

### Input Blocks

Use cards or grouped list items rather than raw form fields floating on the page.

Rules:

- setting groups should look intentional and mobile-native
- keep labels explicit
- support copy should be small and muted

### Replay Button

A signature component.

There are two distinct replay buttons:

- reference tone replay
- target tone replay

Rules:

- equal visual weight
- clearly distinguish labels
- compact but highly tappable
- playback state can show subtle pulse or active state
- disabled while audio is currently playing

Recommended label pattern:

- `基準音`
- `問題音`

### Feedback Badge / Status

Use explicit status chips or inline cards.

Required states:

- 正解
- 不正解
- 保存中
- 保存済み
- 保存失敗

Optional secondary emphasis:

- `惜しい` may be shown only as support emphasis for incorrect answers within `±1` semitone, e.g. `不正解（惜しい）`.
- `惜しい` must not replace the required correct / incorrect status.

Color mapping:

- 正解 = green
- 不正解 = red
- 惜しい support emphasis = amber
- 保存中 = cyan or neutral animated state
- 保存済み = green
- 保存失敗 = red

Never rely on color alone.
Pair status with explicit text, and add an icon when the implementation already has one or can provide one without introducing an unapproved dependency.

### Keyboard Answer Panel

This is a product-defining component.

Rules:

- must include black keys
- must fit in screen width without scroll
- must include some contextual margin around the answer area
- must support reference-key highlight even when note labels are hidden
- correct target must not be shown before answer

Reference key styling:

- use a styling combination that is unmistakable
- soft green fill
- stronger green outline
- optional small label or glow

Do not use only a tiny strip marker.
It is too weak and too easy to miss.

Feedback state on keyboard:

- answered key and correct key must be distinct after answer
- if the answer is correct, merged success styling is allowed

### Distance Answer Grid

Another product-defining component.

Rules:

- in `mixed` direction sessions, upward and downward answers are visually separated
- in `mixed` direction sessions, keep the two-row structure stable
- in `up_only` sessions, use a single upward answer group and do not render an empty downward row
- answer buttons should feel quick and game-like, but still premium
- show current available candidates only
- button sizes may adapt, but readability must remain good

Recommended feel:

- compact
- punchy
- tactile
- not toy-like
- not flat admin buttons

## Screen-Specific Rules

### Home

Goal: immediate entry into training.

Rules:

- keep the first viewport focused on the value of starting training
- distance and keyboard entry cards should be visually strong
- recent summary for logged-in users should be concise, not dense
- do not let stats preview overshadow training entry

### Training Config

Goal: quick setup, minimal hesitation.

Rules:

- show only fields relevant to the current mode
- break settings into small grouped cards
- final CTA should stay clearly dominant
- avoid long helper text blocks

### Distance Training Screen

Goal: fastest possible answer loop.

Rules:

- replay row near the top-middle
- answer grid visually dominant
- progress and current score visible but secondary
- if time-limit mode is active, remaining time must be noticeable but not alarming

### Keyboard Training Screen

Goal: strong sound-to-key mapping.

Rules:

- keyboard should dominate the screen more than surrounding chrome
- reference-key highlight must be unmistakable
- labels should not clutter black keys
- replay and keyboard relationship should feel tight

### Feedback Screen

Goal: fast comprehension.

Rules:

- result state should be readable within one glance
- show correct answer, user answer, error, and response time in a clean stack
- next action must be visually obvious

### Result Screen

Goal: motivation and progression.

Rules:

- session score is the hero metric
- correct rate, average error, and average response time are supporting metrics
- save status should be inline and obvious
- post-session CTA should not look bureaucratic

### Stats Screen

Goal: growth visibility, not BI dashboard complexity.

Rules:

- score is the headline analytical metric
- error and response time are strong secondary metrics
- charts should be readable on mobile
- recent sessions and drill-down links should be concise
- avoid cramped legends and tiny tap targets

### Settings Screen

Goal: calm control, not form fatigue.

Rules:

- global settings group first
- per-mode saved config sections after that
- reset actions must be clear but not destructive-looking unless necessary

### Session Detail

Goal: review saved results without clutter.

Rules:

- session summary first
- config snapshot second
- per-question results last
- preserve strong number hierarchy

## Accessibility Rules

These are non-negotiable.

- touch targets should generally be at least 44px class
- focus state must be visible
- state must not rely on color alone
- contrast must remain sufficient on text and interactive elements
- do not use tiny pale text for important metrics
- error and success messages must have explicit text plus color, and should add an icon when practical without adding an unapproved dependency

## Implementation Rules

### Token Implementation

Codex should implement this document as semantic tokens first.

Preferred approach:

- CSS variables in the global theme layer
- Tailwind token mapping on top of those variables if Tailwind is used

Do not hardcode one-off colors in random components unless approved.

### Component Strategy

- create repo-owned UI primitives
- reuse primitives across home, settings, training, stats, and session detail
- do not scatter unique button styles screen by screen

### Allowed Deviation

Codex may make minor spacing or size adjustments when needed to:

- avoid overflow
- improve tapability
- preserve hierarchy
- fit mobile portrait better

Codex may not change the following without human approval:

- core brand color direction
- semantic meaning mapping
- keyboard reference highlight requirement
- score, error, and response-time hierarchy

### Dependency Guardrail

Do not add a new UI library only to achieve styling convenience unless explicitly approved.

## Acceptance Checklist

A UI implementation is considered aligned only if all are true:

- green remains the main brand color
- the palette feels more stylish and saturated than the earlier conservative draft
- the UI still feels calm, premium, and non-neon
- smartphone portrait usage feels primary, not adapted afterward
- training screens preserve fast answer tempo
- score, error, and response time are visually easy to scan
- keyboard reference note is unmistakably visible during answering
- stats screen feels like a learning app, not an enterprise dashboard
- components look like one family, not isolated screens
- new screens can be built from the same token and component system

## Suggested First Implementation Bundles

Recommended order:

1. theme tokens plus global theme layer
2. button, card, input, and segmented primitives
3. home and settings refresh
4. distance training UI alignment
5. keyboard training UI alignment
6. feedback, result, and save-status UI
7. stats and session detail alignment

Do not attempt full-app visual replacement in one step.

## Intentionally Out Of Scope

- dark theme rules
- final chart library choice
- icon package choice
- image-generation prompt templates

## Final Rule

When in doubt, optimize for:

1. training tempo
2. clarity of answer, feedback, and growth
3. premium green identity
4. mobile-first usability
5. consistency over novelty
