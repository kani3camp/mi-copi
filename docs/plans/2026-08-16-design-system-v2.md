# Design System v2 implementation plan

Status: implementation in progress
Date: 2026-08-16

## Goal

Preserve the current mi-copi product behavior and training UX while replacing the visual language with Design System v2 as a reusable, semantic design system.

## Why now

The approved v2 design removes the historical green-centered brand assumption and establishes a dedicated semantic system for Brand, Reference, Correct, User Answer, Near, and Incorrect. The current implementation already has reusable primitives, training components, Storybook, a11y checks, and route smoke tests, so the migration should build on that foundation rather than copy prototype HTML.

## References

- `docs/product/current-constraints.md`
- `docs/product/decision-log.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `DESIGN.md`
- current shared UI / training components
- current Storybook and `npm run verify`
- approved Design System v2 visual artifacts

## In scope

- v2 semantic token layer
- Azure brand / PWA chrome
- Outfit / Zen Kaku Gothic New / JetBrains Mono typography
- shared primitive appearance
- mobile-first layout and control sizing
- Interval Ruler implementation and Storybook state coverage
- Keyboard semantic feedback treatment for white and black keys
- Storybook coverage for core v2 primitives and training states
- accessibility / reduced-motion preservation
- obsolete green-brand guidance removal from `DESIGN.md`

## Out of scope

- product behavior changes
- training generation or scoring changes
- persistence / DB / schema changes
- auth changes
- removal of existing settings
- new UI library dependencies
- app icon redesign unless the existing icon conflicts with v2

## Files likely touched

- `DESIGN.md`
- `docs/product/decision-log.md`
- `src/app/layout.tsx`
- `src/app/manifest.ts`
- `src/app/design-system-v2.css`
- `.storybook/preview.ts`
- training feedback components and stories
- shared UI stories

## Verification

Required before merge:

- `npm run verify` on GitHub Actions
- Storybook build and browser/a11y tests through the verify pipeline
- training route smoke through the verify pipeline
- review PR diff for accidental domain / persistence changes
- confirm `develop` has not moved incompatibly before merge

## Human approval needed?

No. The user explicitly approved Design System v2 as the visual source of truth and instructed autonomous implementation and merge unless a product-spec decision becomes necessary. No dependency, environment, schema, migration, auth, scoring, persistence, or route-contract change is planned.
