# TrainingConfig Contract Alignment

## Goal

- Align runtime `TrainingConfig` usage to the canonical product/docs contract.

## Why Now

- The repo is functionally green, but config field/unit drift is the main remaining source-of-truth risk.

## References

- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/implementation/ts-types.md`
- `docs/implementation/api-contracts.md`
- `docs/implementation/training-flow.md`
- `docs/plans/2026-03-12-training-config-contract-audit.md`

## In Scope

- Canonicalize `minSemitone` / `maxSemitone` and `timeLimitSeconds`
- Enforce documented bounds in runtime validation and train UI
- Read legacy saved JSON and always write canonical JSON
- Align implementation docs and tests

## Out Of Scope

- DB migration
- New dependencies or env vars
- Score formula changes
- Stats feature changes

## Files Likely Touched

- `src/features/training/model/*`
- `src/features/training/server/*`
- `src/app/train/*`
- `src/app/settings/page.tsx`
- `src/app/sessions/[sessionId]/page.tsx`
- `docs/implementation/*`

## Verification

- Unit tests for normalization and persistence mapping
- `npm run verify`

## Human Approval Needed?

- No
