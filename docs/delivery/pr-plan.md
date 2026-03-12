This file is the repository-level implementation sequence, not the current task file.
Codex should derive the next concrete bundle at run time using Plan mode, while respecting this order and the current codebase state.

# PR Plan

Implementation should be split into small PRs. Each PR should have one main responsibility.

## Recommended Order

### 1. Schema / Types / Contracts

- Add code-level definitions that align with `docs/implementation/*`
- No migration application or auth behavior change

### 2. Pure Logic

- Add question generation, scoring, timer, and aggregation logic as pure modules
- Add tests for deterministic behavior

### 3. Audio / State

- Implement train route state machine and Web Audio playback behavior
- Keep persistence mocked or deferred

### 4. Guest Distance

- Implement guest training flow for distance input mode
- Keep guest results local-only and unsaved

### 5. Guest Keyboard

- Add keyboard input mode on top of the guest flow
- Keep guest results local-only and unsaved

### 6. Auth + Save

- Integrate Better Auth sign-in/out and end-of-session save
- Persist only on result/end-of-session flow
- Keep the result screen visible and provide retry if save fails

### 7. Settings + Home

- Add user settings CRUD and home summary UI/data loading
- Keep scope limited to MVP defaults and summary data

### 8. Stats

- Add overview and trend reads with on-demand aggregation
- No pre-aggregation or background jobs

## PR Rules

- One PR should avoid spanning multiple milestones unless blocked by shared groundwork.
- Each PR should update docs only when the implemented behavior clarifies an already-approved unresolved point.
- If a PR needs DB schema confirmation, migration work, auth flow changes, env vars, or dependencies, stop and request human review first.
