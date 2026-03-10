# DB Schema

This document is the source of truth for the intended DB boundary between Better Auth managed tables and app-specific tables.

- Do not create or modify migrations from this document alone.
- Better Auth managed tables live in a separate auth schema module from app tables.
- App-specific tables must reference Better Auth's `user` table as the parent for authenticated data.
- Guest sessions are not stored in the DB.

## Schema Boundary

- Auth schema code lives in `src/lib/db/schema/auth.ts`.
- App schema code lives in `src/lib/db/schema/app.ts`.
- Shared Drizzle schema exports live in `src/lib/db/schema/index.ts`.
- Treat `src/lib/db/schema/index.ts` as the single Drizzle migration source entrypoint that re-exports both auth and app schema.
- Drizzle config lives in `drizzle.config.ts` and points its `schema` to `src/lib/db/schema/index.ts`.
- Migrations for both auth and app schema are still not created or executed in the repository.
- Before any migration is written, verify `src/lib/db/schema/auth.ts` against the Better Auth CLI generate output and treat the generated schema as the canonical reference for auth tables.
- Reproduce the auth schema comparison via `npm run auth:generate:schema`, which writes comparison artifacts to `/tmp` instead of overwriting repo files.

## Better Auth Tables

The Better Auth side is modeled separately from app tables and should stay aligned with the library's generated schema before migrations are created.

- `user`
  - Parent authenticated user row used by app-side foreign keys
- `session`
  - Active session rows resolved by server-side current-user helpers
- `account`
  - Provider-linked account rows such as Google OAuth
- `verification`
  - Verification / token lifecycle rows required by Better Auth flows

These tables are scaffolded in code only at this stage. Exact columns, defaults, and constraints must be verified against the Better Auth generated schema before migration work begins.
Current expected residual differences from generated output are limited to repo-local symbol names, adapter mapping wrappers, and helper/type exports; table/column semantics should match the generated schema.

## Parent Auth Table

- Parent: Better Auth `user`
- Reference rule: app tables use `user_id` that references `user.id`
- Exact column type for `user_id` must match the Better Auth adapter setup and the actual generated Better Auth schema at implementation time

## `user_settings`

One row per authenticated user.

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | auth user id type | Primary key, foreign key to `user.id` |
| `last_distance_config` | `jsonb` | Not null; latest saved `DistanceTrainingConfig` |
| `last_keyboard_config` | `jsonb` | Not null; latest saved `KeyboardTrainingConfig` |
| `created_at` | `timestamptz` | Not null |
| `updated_at` | `timestamptz` | Not null |

Constraints and indexes:

- Primary key on `user_id`
- Foreign key to Better Auth `user.id`

## `training_sessions`

One persisted training session per completed authenticated save.

- Guest sessions do not create rows in this table.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key; DB-generated UUID in the MVP |
| `user_id` | auth user id type | Foreign key to `user.id`, not null |
| `mode` | `text` | Not null; `distance` or `keyboard` |
| `score_formula_version` | `text` | Not null, initial value `v1` |
| `finish_reason` | `text` | Not null; `target_reached`, `time_up`, or `manual_end` |
| `end_condition_type` | `text` | Not null; `question_count` or `time_limit` |
| `config_snapshot` | `jsonb` | Not null; stores the applied `TrainingConfig` |
| `planned_question_count` | `integer` | Nullable; planned number of questions when available |
| `planned_time_limit_seconds` | `integer` | Nullable; planned session-wide time limit in seconds when available |
| `answered_question_count` | `integer` | Not null |
| `correct_question_count` | `integer` | Not null |
| `session_score` | `numeric(10,3)` | Not null |
| `avg_score_per_question` | `numeric(10,3)` | Not null |
| `accuracy_rate` | `numeric(10,3)` | Not null; `0..1` |
| `avg_error_abs` | `numeric(10,3)` | Not null |
| `avg_response_time_ms` | `numeric(10,3)` | Not null |
| `started_at` | `timestamptz` | Not null |
| `ended_at` | `timestamptz` | Not null |
| `created_at` | `timestamptz` | Not null |

Constraints and indexes:

- Primary key on `id`
- Foreign key on `user_id`
- Check `planned_question_count >= 0` when present
- Check `planned_time_limit_seconds > 0` when present
- Check `answered_question_count >= 0`
- Check `correct_question_count >= 0`
- Check `answered_question_count <= planned_question_count` when present
- Check `end_condition_type = question_count` requires `planned_question_count`
- Check `end_condition_type = time_limit` requires `planned_time_limit_seconds`
- Check `correct_question_count <= answered_question_count`
- Check `session_score >= 0`
- Check `avg_score_per_question >= 0`
- Check `0 <= accuracy_rate <= 1`
- Check `avg_error_abs >= 0`
- Check `avg_response_time_ms >= 0`
- Index on `user_id`
- Index on `(user_id, mode, ended_at desc)`
- Index on `(user_id, ended_at desc)`

## `question_results`

One row per answered question that is included in a saved authenticated session.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key; DB-generated UUID in the MVP |
| `training_session_id` | `uuid` | Foreign key to `training_sessions.id`, not null |
| `user_id` | auth user id type | Not null; parent user for stats/read queries |
| `question_index` | `integer` | Zero-based stable order value |
| `presented_at` | `timestamptz` | Not null |
| `answered_at` | `timestamptz` | Not null |
| `mode` | `text` | Not null; `distance` or `keyboard` |
| `base_note_name` | `text` | Not null; note class name |
| `base_midi` | `integer` | Not null |
| `target_note_name` | `text` | Not null; note class name |
| `target_midi` | `integer` | Not null |
| `answer_note_name` | `text` | Not null; note class name |
| `answer_midi` | `integer` | Not null |
| `target_interval_semitones` | `numeric(10,3)` | Not null |
| `answer_interval_semitones` | `numeric(10,3)` | Not null |
| `direction` | `text` | Not null; `up` or `down` |
| `is_correct` | `boolean` | Not null |
| `error_semitones` | `numeric(10,3)` | Not null |
| `response_time_ms` | `integer` | Not null |
| `replay_base_count` | `integer` | Not null |
| `replay_target_count` | `integer` | Not null |
| `score` | `numeric(10,3)` | Not null |
| `score_formula_version` | `text` | Not null, initial value `v1` |
| `created_at` | `timestamptz` | Not null |

Constraints and indexes:

- Primary key on `id`
- Foreign key on `training_session_id`
- Unique key on `(training_session_id, question_index)`
- Check `response_time_ms >= 0`
- Check `replay_base_count >= 0`
- Check `replay_target_count >= 0`
- Check `question_index >= 0`
- Index on `training_session_id`
- Index on `(user_id, mode, answered_at desc)`
- Index on `(training_session_id, question_index)`

## Notes

- Unanswered questions that time out are discarded and are not persisted in `question_results`.
- Session-level summary values are stored so the home and stats views can read concise aggregates while still allowing recalculation from question rows if needed.
- `training_sessions` stores the canonical session summary values corresponding to `SessionSummaryMetrics`.
- `training_sessions` also stores explicit end-condition and finish-reason columns so session lifecycle can be queried without unpacking `config_snapshot`.
- `training_sessions.mode` and `question_results.user_id` are stored explicitly so persistence insert shapes map directly to schema columns.
- Score values are stored as decimals rounded to three fractional digits.
- No guest-session backfill table or deferred attach flow is included in the MVP schema.
- `config_snapshot` stores the canonical `TrainingConfig`, including note-class based `fixedBaseNote` and string-based `intervalGranularity` where applicable.
- Fixed runtime values such as `referencePitchHz = 440` are not added as config fields.
- `question_results` stores explicit values needed for scoring/statistics recalculation rather than question/answer payload blobs.
