# Whole App Visual Polish Plan

## Goal

Align all user-facing screens with `docs/product/ui-system.md` and replace the current ad-hoc inline MVP styling with a token-driven, mobile-first visual layer, while keeping behavior, routes, data contracts, and training logic unchanged.

## Why Now

The app already has working flows across training, home, login, settings, stats, and session detail. Current styling is duplicated in `src/app/ui/polish.ts` and page-local inline objects, and its palette/spacing diverge from the canonical UI token doc.

## References

- `docs/product/ui-system.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/delivery/acceptance-criteria.md`
- `src/app/ui/polish.ts`
- current pages under `src/app/*`

## In Scope

- app-wide theme tokens
- shared visual primitives
- training-screen polish for both modes
- server-first page polish
- accessibility and mobile refinements

## Out Of Scope

- schema/auth/save logic changes
- route changes
- new dependencies
- chart-library adoption
- copy rewrites beyond concise UI tightening

## Files Likely Touched

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/ui/*`
- `src/app/page.tsx`
- `src/app/login/*`
- `src/app/settings/*`
- `src/app/stats/page.tsx`
- `src/app/sessions/[sessionId]/page.tsx`
- `src/app/train/*`

## Verification

- `npm run typecheck`
- `npm run check`
- `npm run lint:repo`
- `npm run build`
- manual verification on mobile-first widths for home/login/settings/stats/session detail
- manual verification for distance and keyboard training across all phases
- accessibility spot-check for focus visibility, touch targets, contrast, and non-color-only status

## Human Approval Needed?

- No, as long as dependencies, routes, and contracts stay unchanged.
