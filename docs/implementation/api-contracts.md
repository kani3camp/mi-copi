# API Contracts

Internal data access should prefer Server Actions / Server Functions.

- Use route handlers only where required by framework or library integration.
- Do not call the DB during active answering flow.

## Auth

### `getCurrentUser`

- Role: resolve the currently signed-in user for UI gating
- Input: none
- Output:

```ts
type GetCurrentUserResult = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};
```

### `signInWithGoogle`

- Role: start Google sign-in through Better Auth
- Input: none
- Output: redirect-oriented result or library-managed navigation side effect

### `signOut`

- Role: end the current authenticated session
- Input: none
- Output: redirect-oriented result or library-managed navigation side effect

## Home And Settings

### `getHomeSummary`

- Role: return the minimum home dashboard summary for the current user
- Input: none
- Output:

```ts
type HomeSummary = {
  user: GetCurrentUserResult["user"];
  stats: StatsOverview | null;
  hasSavedSessions: boolean;
};
```

### `getUserSettings`

- Role: read the current user's saved defaults
- Input: none
- Output:

```ts
type GetUserSettingsResult = UserSettings | null;
```

### `updateUserSettings`

- Role: upsert the current user's last-used configs for each training mode
- Input:

```ts
type UpdateUserSettingsInput = UserSettings;
```

- Output:

```ts
type UpdateUserSettingsResult = UserSettings;
```

## Training

### `getInitialTrainingConfig`

- Role: produce the config shown on the train screen before the session starts
- Input: none
- Output:

```ts
type GetInitialTrainingConfigResult = TrainingConfig;
```

Rules:

- If the user has saved settings, use them as the base value.
- Otherwise return the MVP default config.
- Return the canonical `TrainingConfig` described in `docs/product/requirements.md`.
- `referencePitchHz = 440` is a fixed runtime value in the MVP and is not included in this payload.
- `endCondition.timeLimitMinutes` is a session-wide limit when `type = time_limit`.
- In `distance` mode, `intervalGranularity` is `simple` or `aug_dim`.
- In `keyboard` mode, no extra mode-specific config fields are added.

### `saveTrainingSession`

- Role: persist one completed authenticated session and its answered question results
- Input:

```ts
type SaveTrainingSessionInput = import("./ts-types").SaveTrainingSessionInput;
```

Top-level session fields:

- `finishReason` with canonical values `target_reached`, `time_up`, or `manual_end`
- `endCondition`

`summary` contains:

- `plannedQuestionCount?`
- `answeredQuestionCount`
- `correctQuestionCount`
- `sessionScore`
- `avgScorePerQuestion`
- `accuracyRate`
- `avgErrorAbs`
- `avgResponseTimeMs`

- Output:

```ts
type SaveTrainingSessionResult =
  | {
      ok: true;
      sessionId: string;
      savedQuestionCount: number;
    }
  | {
      ok: false;
      code: "UNAUTHORIZED" | "INVALID_INPUT" | "SAVE_FAILED";
      message: string;
    };
```

Rules:

- Require an authenticated current user.
- Accept only end-of-session batch saves.
- Flow: `SaveTrainingSessionInput` -> validate -> pure persistence mapper -> drizzle adapter -> transaction insert into `training_sessions` and `question_results`.
- Server-side composition is layered as: current user resolve -> drizzle adapter resolve -> core `saveTrainingSession(...)` call.
- The current-user resolve step is implemented via a Better Auth server-side helper under `src/lib/auth/server.ts`.
- The repository-level Drizzle client export lives in `src/lib/db/client.ts`, and the training entrypoint imports it instead of using a DB stub.
- Persist only answered questions.
- Save `training_sessions.finish_reason` from `finishReason`.
- Save `training_sessions.end_condition_type` plus `planned_question_count` or `planned_time_limit_seconds` from `endCondition`.
- Persist `planned_time_limit_seconds` as `endCondition.timeLimitMinutes * 60` when `endCondition.type = time_limit`.
- Save `training_sessions.mode` from `input.config.mode`.
- Save `training_sessions.config_snapshot` plus session summary values.
- Summary values should match the canonical persistence summary type in `docs/implementation/ts-types.md`.
- `summary` should map directly to the explicit summary columns stored in `training_sessions`.
- Save `question_results` as explicit per-question columns used for scoring/statistics recalculation.
- Save `question_results.user_id` from the authenticated user id passed into the persistence mapping layer.
- Keep the Drizzle adapter as a thin boundary that only wraps transaction and insert calls; validation and business rules stay in the server action and pure mappers.
- If repo-level DB/auth wiring is not available yet, the composition root may stay as a TODO-backed stub rather than inventing new infrastructure.
- Recompute or validate summary fields on the server before writing.
- Guest flows never call this contract.
- Return `UNAUTHORIZED` for guest or missing-user calls, `INVALID_INPUT` for failed input validation, and `SAVE_FAILED` when the transaction fails.
- If the save fails, the client keeps the result screen visible and offers retry.

## Stats

### `getStatsOverview`

- Role: return aggregate stats for the current user
- Input:

```ts
type GetStatsOverviewInput = {
  days?: number;
};
```

- Output:

```ts
type GetStatsOverviewResult = StatsOverview;
```

### `getRecentQuestionTrends`

- Role: return recent answered-question level trend points
- Input:

```ts
type GetRecentQuestionTrendsInput = {
  limit?: number;
};
```

- Output:

```ts
type GetRecentQuestionTrendsResult = RecentQuestionTrend[];
```

### `getDailyTrends`

- Role: return day-level aggregates for the current user
- Input:

```ts
type GetDailyTrendsInput = {
  days?: number;
};
```

- Output:

```ts
type GetDailyTrendsResult = DailyTrendPoint[];
```

## Open Points

- TODO: confirm the exact error shape shared across Server Actions / Server Functions.
- TODO: confirm whether stats endpoints default to all-time or a fixed recent window when `days` is omitted.
