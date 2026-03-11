# Acceptance Criteria

This file defines the completion template for implementation PRs.

## Global Criteria

- The PR matches the approved docs and does not expand scope.
- The PR has one main responsibility.
- Types, tests, and validation are updated where the logic changes require them.
- `check`, `lint:repo`, `typecheck`, relevant tests, and build pass when the project scaffold exists.

## Per-PR Template

Each PR should explicitly answer the following:

### What must be complete

- The user-visible or code-visible behavior added in this PR
- The contract/types/tests that must land with it

### What is not included

- The adjacent work intentionally deferred to later PRs
- Any known TODOs left in place without breaking the approved scope

### Required verification

- Which `check` / `lint` / `lint:repo` command was run
- Which typecheck command was run
- Which test files or test command were run
- Whether `npm run build` or `npm run verify` was run
- Which manual verification steps were performed, if any

## Examples By Planned PR

### PR 1: Schema / Types / Contracts

- Complete when schema/type/contract definitions exist in code and match the docs
- Complete when `TrainingConfig` fields, ranges, defaults, `question_index = 0` origin, and DB-generated UUID assumptions are reflected in code-level contracts
- Not complete if migrations are applied or auth behavior changes

### PR 2: Pure Logic

- Complete when question generation, scoring, and related pure logic are implemented and tested
- Not complete if UI state or audio behavior is coupled into the logic layer

### PR 3: Audio / State

- Complete when the train route can progress through the defined client states with audio playback
- Complete when the config UI exposes only the user-visible MVP config fields and respects mode-specific differences
- Not complete if authenticated save is introduced here

### PR 4-5: Guest Flows

- Complete when guest distance and keyboard modes work independently in sequence and do not persist session results
- Not complete if guest results are saved or backfilled after later login

### PR 6: Auth + Save

- Complete when authenticated users can sign in and save a finished session once at the result stage
- Complete when save failure keeps the result screen visible and exposes retry
- Not complete if answering flow introduces DB access

### PR 7: Settings + Home

- Complete when settings persist and home summary reads work for the signed-in user
- Not complete if stats expansion is bundled into the same PR without necessity

### PR 8: Stats

- Complete when overview and trend reads work from persisted data with on-demand aggregation
- Not complete if pre-aggregation or background jobs are added
