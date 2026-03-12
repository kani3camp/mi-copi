# Save Validation Hardening

## Goal

- Make `saveTrainingSession` server-authoritative for config, score, and summary persistence.

## Why Now

- `TrainingConfig` shape is now canonicalized, but the save entrypoint still trusts client payloads too much.

## References

- `docs/implementation/api-contracts.md`
- `docs/implementation/scoring.md`
- `docs/implementation/db-schema.md`
- `docs/product/requirements.md`
- `src/features/training/model/config.ts`
- `src/features/training/model/summary.ts`

## In Scope

- Pure save-input normalization and validation
- Shared v1 scoring helper reused by guest flows and save path
- Server-side score and summary recomputation before persistence
- Save-path tests for tampered and legacy payloads

## Out Of Scope

- Migration work
- New dependencies or env vars
- UI copy changes unrelated to save correctness

## Files Likely Touched

- `src/features/training/model/*`
- `src/features/training/server/*`
- `docs/implementation/api-contracts.md`

## Verification

- Focused save/scoring unit tests
- `npm run verify`

## Human Approval Needed?

- No
