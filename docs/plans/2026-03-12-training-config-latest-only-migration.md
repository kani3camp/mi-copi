# Training Config Latest-Only Migration

## Goal

- Remove transitional legacy `TrainingConfig` compatibility from the runtime contract and migrate persisted JSON snapshots to the canonical shape.

## Why Now

- The previous bundles aligned the canonical contract, but the app still accepted old keys and units during reads and saves.
- The requested direction is to make the latest shape the only supported runtime contract.

## References

- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/implementation/api-contracts.md`
- `src/features/training/model/config.ts`
- `src/features/training/server/lastUsedTrainingConfig.ts`
- `src/features/training/server/getTrainingSessionDetail.ts`

## In Scope

- Strict canonical config parsing for runtime code
- Legacy-to-canonical migration helpers isolated from runtime validation
- Save-path rejection of legacy payloads
- Persisted JSON rewrite for stored user settings and session config snapshots when legacy shapes are encountered
- Tests and docs updates for latest-only behavior

## Out Of Scope

- DB schema changes or migrations
- New dependencies or env vars
- UI redesign unrelated to config contract enforcement

## Files Likely Touched

- `src/features/training/model/*`
- `src/features/training/server/*`
- `src/features/settings/server/*`
- `docs/implementation/*`

## Verification

- Focused config migration / save validation tests
- `npm run verify`

## Human Approval Needed?

- No additional approval; the user explicitly requested the latest-only migration direction.
