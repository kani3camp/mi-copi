# mi-copi Design System v2

Last updated: 2026-08-16

## 1. Canonical status

This document is the visual and interaction design source of truth for mi-copi.

Product behavior, persistence, authentication, scoring, training state transitions, and feature scope remain governed by:

1. `docs/product/current-constraints.md`
2. `docs/product/decision-log.md`
3. `docs/product/requirements.md`
4. `docs/product/basic-design.md`
5. `docs/product/tech-stack.md`

When a visual mock contains sample data, simplified controls, placeholder wording, or prototype-only interaction, do not treat it as a product requirement. Preserve the current product specification and translate the approved visual language into repo-owned components.

The shipped token layer is `src/app/design-system-v2.css`. Existing class names may be retained as implementation contracts, but their visual meaning must resolve through v2 semantic tokens rather than screen-specific colors. `src/app/design-system-v2-compat.css` is a temporary bridge for legacy class contracts and must remain small.

## 2. Design principles

mi-copi is a focused relative-pitch learning tool for ear-copy practice. It should feel precise, warm, compact, and instrument-like without becoming skeuomorphic or game-like.

Priority order:

1. training tempo
2. immediate comprehension of reference, correct answer, user answer, and error distance
3. smartphone portrait usability
4. semantic consistency
5. calm visual quality
6. reusable component structure

Do not optimize for decorative novelty, dashboard density, or desktop-first composition.

## 3. Brand and semantic color

### 3.1 Critical rule

**mi-copi is not a green-brand UI.**

Brand color and learning-state colors are separate systems.

- Brand / Primary Action: Azure
- Reference Note: Gold
- Correct: Sage
- User Answer: Violet
- Near: Amber
- Incorrect: Rose
- Neutral information: Slate / neutral ink

Green-family Sage is reserved for the meaning **Correct**. Do not reuse it as the general brand, primary CTA, selected navigation color, focus ring, or decorative default.

### 3.2 Primitive roles

Canonical OKLCH primitives:

```txt
Canvas            oklch(0.966 0.004 90)
Card              oklch(1 0 0)
Panel             oklch(0.980 0.003 90)
Tray              oklch(0.932 0.005 90)
Line              oklch(0.900 0.005 90)
Line strong       oklch(0.860 0.006 90)
Ink               oklch(0.220 0.008 90)
Heading           oklch(0.270 0.008 90)
Body              oklch(0.450 0.006 90)
Label             oklch(0.540 0.006 90)
Faint             oklch(0.660 0.006 90)

Brand Azure       oklch(0.580 0.135 195)
Brand Action      oklch(0.520 0.140 195)
Reference Gold    oklch(0.790 0.125 88)
Correct Sage      oklch(0.700 0.100 138)
Answer Violet     oklch(0.550 0.155 293)
Near Amber        oklch(0.760 0.140 58)
Incorrect Rose    oklch(0.600 0.190 22)
```

The CSS variables prefixed with `--mc-` are the canonical runtime names.

### 3.3 Meaning is stable across screens

Never change semantic meaning for aesthetic convenience.

- Azure means brand, primary action, current focus, and app-level selection.
- Gold means reference note / origin.
- Sage means correct target / successful pitch result.
- Violet means the user's answer.
- Amber means near / almost correct.
- Rose means incorrect / destructive error state where applicable.
- Ink is the default color for scores and important numbers. A high score is not itself a success-status color.

### 3.4 Non-color redundancy

Learning state must never depend on color alone.

Use the following vocabulary consistently:

- Reference: `基準` + diamond `◆`
- Correct: `正解` + circle `○`
- Answer: `回答` + triangle `△`
- Near: `惜しい` + approximation cue `≈` where useful
- Incorrect: `不正解` + cross `×` where useful

These cues may appear as labels, markers, borders, bands, shapes, and connectors depending on the component.

## 4. Typography

### 4.1 Font roles

The app formally uses:

- Display / Latin emphasis: **Outfit**
- Japanese UI text: **Zen Kaku Gothic New**
- Notes / semitone values / ruler values / timer-like metrics: **JetBrains Mono**

Fonts are loaded through `next/font` in `src/app/layout.tsx`. Fallbacks must remain usable if the web font is unavailable.

### 4.2 Mobile-first scale

```txt
Page title          26px / 1.15 / 800
Section title       15px / 1.45 / 700
Body                13px / 1.65
Small label         11px / 1.45 / 600-700
Hero metric         38-52px / tight / 800
```

At desktop widths, page titles may grow to roughly 40-44px and body text to 14-15px. Do not simply scale every element proportionally.

### 4.3 Numeric presentation

Scores, response times, error values, and note/ruler values should use tabular or monospaced treatment where it improves scanability.

The headline score remains neutral Ink. Error and timing can use supporting semantic or analytical accents, but the number hierarchy must not become a rainbow dashboard.

## 5. Spacing and shape

Use a 4px-derived rhythm.

```txt
4, 8, 12, 16, 20, 24, 32, 40, 48
```

Typical mobile values:

- page side padding: 20px at 375-599px
- compact phone side padding: 16px at 360-374px
- card padding: 16px
- section gap: 24px
- control gap: 8-12px

Radius vocabulary is intentionally small:

```txt
8px, 12px, 16px, 20px, pill
```

Use 12px for most controls, 16-20px for cards and major panels, and pill only for true pill controls.

## 6. Elevation

Use only the approved subtle elevation families:

- card shadow
- key/control shadow
- focus ring

Avoid floating-card stacks, large blur halos, colored glow, or decorative elevation. Borders do most of the structural work.

## 7. Motion

Motion supports recognition, never entertainment.

```txt
Fast interaction        about 140ms ease-out
Feedback transition     about 220ms ease-out
Marker movement         about 320ms cubic-bezier(0.2, 0.8, 0.2, 1)
```

Training taps must feel immediate.

For `prefers-reduced-motion: reduce`, eliminate non-essential movement and shorten remaining state transitions. Do not use bouncy springs.

## 8. Responsive layout

Smartphone portrait is the design origin.

### 360-374px

- 16px page side padding
- 2-column answer candidates where applicable
- preserve readable type instead of shrinking labels aggressively
- touch targets remain at least 44px class

### 375-599px

- 20px page side padding
- 390px is the main design reference width
- 2-column answer candidates by default

### 600-1023px

- centered content around 640px for focused flows
- 32px side padding
- 3-4 column candidates where content allows

### 1024px+

- general pages may expand to roughly 960-1040px
- focused training may remain narrower
- 40px side padding
- answer candidates may use 4-6 columns

Desktop is an adaptation of the same hierarchy, not the source layout scaled up.

## 9. Core primitives

### 9.1 AppShell

Provides page width, responsive side padding, and vertical rhythm. Training routes may use the narrow shell.

### 9.2 Surface

Use restrained white or subtle neutral panels with a one-pixel structural border and soft shadow. An `accent` surface does not mean a brand-colored slab.

### 9.3 Button

Primary:

- darker Azure action fill; the canonical Brand Azure remains available for
  non-text brand surfaces
- light text
- one dominant primary CTA per local context when possible
- 48px minimum normal height

Secondary:

- white / neutral fill
- neutral strong border
- Ink text

Ghost:

- visually subordinate
- must remain a full accessible target when used as an action

Danger:

- Rose semantics only when the action is destructive or genuinely error-related

Disabled / pending:

- reduce contrast and saturation
- keep the label readable
- expose disabled or busy semantics programmatically

### 9.4 Chip / status label

Chips are compact labels, not decoration. Use explicit text together with the semantic color.

### 9.5 Inputs

Inputs use neutral surfaces and borders. Focus uses the Azure focus ring. Native controls may be styled but must preserve keyboard and screen-reader behavior.

### 9.6 Toggle

Boolean settings use a clear native checkbox-style control. State must remain understandable from the checked state and label, not from color alone. Do not replace the approved checkbox with a custom switch solely for decoration.

### 9.7 Slider

Use a minimum 44px interaction area. Azure indicates the active control, not learning correctness.

### 9.8 Metric / score

Use a small label plus dominant numeric value. Score should use Ink. Supporting labels remain quiet.

## 10. Training controls

### 10.1 Audio buttons

Reference and target replay buttons have equal structural weight.

Required labels:

- `基準音`
- `問題音` or `正解音` during feedback where appropriate

Playback state may use Violet because it represents an active interaction state in this context, not correctness. Buttons remain disabled while playback is locked according to the existing behavior.

### 10.2 Interval answer buttons

- one tap finalizes the answer immediately
- no design mock may introduce a second submit step
- minimum height 56px
- maintain readable labels instead of shrinking excessively
- directional grouping continues to follow the product requirements
- candidate count and existing settings remain intact

## 11. Interval Ruler

The Distance feedback visualization is a formal product component called **Interval Ruler**.

It visualizes the relationship among:

- reference position
- correct target
- user answer
- distance between them

### 11.1 Geometry

The ruler automatically fits the minimum and maximum of:

- reference `0`
- signed correct interval
- signed answer interval

with approximately one semitone of visual padding on each side.

Do not force every result into a static 0-12-only diagram when a signed or reverse-direction result needs negative space.

### 11.2 Semantic lanes

- Reference: Gold diamond on the zero axis
- Correct: Sage circle and Sage line in the upper lane
- Answer: Violet triangle and Violet line in the lower lane

Connectors tie the lane markers back to the shared ruler axis.

### 11.3 States that must remain covered

Storybook must include at least:

- upward
- downward
- exact match
- one semitone higher
- one semitone lower
- large error
- answer at reference
- reverse-direction answer
- octave / boundary case
- narrow mobile examples

For exact match, correct and answer occupy the same horizontal tick but retain distinct vertical semantic lanes. Do not collapse them into an ambiguous single-color mark.

## 12. Keyboard feedback

The keyboard is the other product-defining visualization.

### 12.1 Base keyboard

- include white and black keys
- no horizontal scrolling in the normal training flow
- preserve enough surrounding context to understand interval position
- note-label visibility is independent of the reference indication

### 12.2 Reference during answering

The reference key is always identifiable during answering, including randomized-reference sessions and when note labels are hidden.

Reference uses:

- Gold role band / outline
- `基準` label
- diamond cue

Do not fall back to a tiny strip that can be overlooked.

### 12.3 Feedback roles

After answering:

- Correct = Sage + `正解` + circle cue
- User Answer = Violet + `回答` + triangle cue
- Reference = Gold + `基準` + diamond cue

White keys primarily use role bands near the key edge. Black keys use a visible top bar plus outline/ring so the role is not lost against the dark key surface.

### 12.4 Multiple roles on one key

Roles may overlap:

- Exact Match
- Reference + Correct
- Reference + Answer
- Reference + Correct + Answer

Do not replace multiple meanings with one arbitrary color. Stack bands or otherwise preserve every applicable role.

Labels may be vertically offset when adjacent keys would collide. Marker/label association should remain visually obvious.

### 12.5 Required Storybook coverage

Maintain stories for:

- white key state
- black key state
- reference
- correct
- answer
- exact match
- reference + correct
- reference + answer
- adjacent correct / answer states
- hidden note labels while reference remains visible
- locked playback state

## 13. Feedback status

The correctness status remains explicit text:

- `正解`
- `惜しい`
- `不正解`

Near is a supporting learning state, not a replacement for the underlying result data. Existing score/error logic remains authoritative.

## 14. Screen guidance

### Home

Make training entry the first visual priority. Logged-in summaries remain useful but must not overpower the start actions. Do not create an oversized decorative hero.

### Login

Keep the Google login and guest paths unmistakable. Brand treatment is Azure and neutral, not success green.

### Training Config

Preserve every currently supported setting. Group controls into small, deliberate surfaces. Do not copy simplified mock controls over the real feature set.

### Distance Training

Replay controls and answer candidates dominate the interaction. Progress and score remain visible but secondary. One-tap answer behavior is fixed.

### Keyboard Training

The keyboard dominates the answer region. Reference indication is persistent and independent of note labels.

### Feedback

The user should understand result state, correct answer, own answer, error relationship, and response time in one glance. The Interval Ruler or Keyboard Feedback visualization is the primary explanatory object.

### Result

Session score is the hero metric, shown in Ink. Correct rate, average error, and average response time support it. Save status remains visible in-place without becoming the visual headline.

### Stats

Present growth, not BI complexity. Score is the headline analytical metric. Error and response time are strong secondary metrics. Charts and metrics must remain legible on phone widths.

### Settings

Prioritize calm grouping and clear current state. Global settings appear before per-mode saved configuration. Existing behavior and persistence rules remain unchanged.

### Session Detail

Show summary first, configuration snapshot second, and per-question detail after that.

## 15. Accessibility

WCAG AA is the minimum quality bar.

Required:

- visible focus ring using Brand Azure
- keyboard operability
- semantic HTML
- explicit accessible names for icon-like controls
- screen-reader status announcements where the existing component requires them
- minimum 44px-class touch targets for interactive controls
- no learning state communicated by color alone
- sufficient contrast for text and controls
- reduced-motion support

Do not remove native semantics merely to obtain a visual appearance.

## 16. PWA and browser chrome

The browser / PWA theme follows Brand Azure, while the launch background follows the warm neutral canvas.

Current canonical sRGB fallbacks:

```txt
Theme / Brand Azure: #009193
Canvas background:   #F5F4F1
```

App icons are separate brand assets. Do not regenerate them solely because the UI color system changes. Change them only when they visibly conflict with the approved icon design or a dedicated icon revision is approved.

## 17. Storybook and testing

Storybook is part of the design-system contract, not a screenshot gallery.

At minimum keep stable states for:

- Primary Button
- Secondary Button
- Audio Button
- Interval Answer Button
- Interval Ruler
- Keyboard
- Feedback Status
- Metric / Score
- Input
- Toggle / checkbox
- Slider

Storybook accessibility tests run with violations treated as errors. Training route smoke tests remain part of the full verification pipeline.

When adding a reusable state or semantic role, prefer adding a Storybook state at the same time.

## 18. Implementation guardrails

Do:

- start from semantic tokens
- reuse repo-owned primitives
- preserve existing behavior and domain logic
- keep CSS responsibilities at component / design-system level
- use data attributes for semantic component states when appropriate
- add focused stories for important visual states

Do not:

- paste prototype HTML wholesale
- recreate each screen with isolated styles
- add large inline-style blocks
- invent one-off colors, radii, or spacing values without extending the system
- restore a green-centered brand model
- use mock simplifications to remove real settings or product behavior
- modify scoring, persistence, auth, or training logic for a visual refresh
- postpone mobile correctness until after desktop

## 19. Compatibility and cleanup

The pre-v2 application already uses stable shared component class names. During migration, those class contracts may remain while `design-system-v2.css` maps them onto v2 semantic tokens.

This compatibility strategy is intentional and is preferable to duplicating every component or pasting mock HTML. New UI should use v2 semantic roles directly.

Legacy color names must not be treated as semantic truth. In particular, a historical class or variable containing `green` or `teal` does not authorize a green brand or teal answer state. The v2 mapping is authoritative.

When an old alias becomes unused, remove it rather than perpetuating two design systems.

## 20. Definition of aligned UI

A UI change is aligned with Design System v2 only when all of the following are true:

- Brand / primary action is Azure, not green
- Correct and brand colors are semantically separate
- Reference / Correct / Answer / Near / Incorrect meanings are stable
- learning state is not color-only
- mobile portrait around 390px is first-class
- 360, 375, 390, 430, tablet, and desktop widths do not structurally break
- Distance feedback uses the Interval Ruler language
- Keyboard feedback preserves overlapping semantic roles on white and black keys
- existing product behavior and settings remain intact
- shared primitives feel like one family
- Storybook covers important reusable states
- focus, touch target, keyboard, screen-reader, and reduced-motion behavior remain acceptable
- PWA/browser theme uses v2 brand styling
