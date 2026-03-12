# TrainingConfig Contract Audit

## Summary

- Goal: inventory the current `TrainingConfig` contract mismatch across product docs, implementation docs, and code without changing runtime behavior.
- Default assumption for this audit: `docs/product/*` remains the higher-priority product source, but conflicts are reported rather than resolved here.
- Scope of this note: discrepancy inventory, impact analysis, and next-bundle recommendations only. No code changes, schema changes, migrations, or product-policy rewrites are included.

## Baseline Verification

- `npm run verify` passed on 2026-03-12 before this audit note was added.
- Result: the repo is green as-is, so the current risk is contract drift rather than failing runtime behavior.

## Field-By-Field Audit

### `mode`

- Product source:
  - Canonical values are `distance | keyboard` in [`docs/product/requirements.md:381`](docs/product/requirements.md) and the basic design type sketch in [`docs/product/basic-design.md:233-245`](docs/product/basic-design.md).
- Implementation docs:
  - `TrainingConfig.mode` is `TrainingMode`, and `TrainingMode = "distance" | "keyboard"` in [`docs/implementation/ts-types.md:37-38`](docs/implementation/ts-types.md) and [`docs/implementation/ts-types.md:87-109`](docs/implementation/ts-types.md).
- Code/type definition:
  - `TrainingMode` and `TrainingConfigBase.mode` match the docs in [`src/features/training/model/types.ts:1`](src/features/training/model/types.ts) and [`src/features/training/model/types.ts:63-83`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Separate train routes still use the same two canonical modes, and the settings/session snapshot views assume the same union in [`src/app/settings/page.tsx:193-205`](src/app/settings/page.tsx) and [`src/app/sessions/[sessionId]/page.tsx:106-116`](src/app/sessions/[sessionId]/page.tsx).
- Persistence/storage impact:
  - Stored both explicitly as `training_sessions.mode` and inside `config_snapshot` in [`src/lib/db/schema/app.ts:70-91`](src/lib/db/schema/app.ts) and described in [`docs/implementation/db-schema.md:71-81`](docs/implementation/db-schema.md).
- Audit status:
  - Aligned.

### `intervalRange.minSemitone`

- Product source:
  - Canonical field name is singular `minSemitone`, with allowed range `0..11`, in [`docs/product/requirements.md:382`](docs/product/requirements.md) and [`docs/product/basic-design.md:235-238`](docs/product/basic-design.md).
- Implementation docs:
  - `docs/implementation/ts-types.md` also uses singular `minSemitone` in [`docs/implementation/ts-types.md:68-71`](docs/implementation/ts-types.md).
- Code/type definition:
  - Runtime type uses plural `minSemitones` in [`src/features/training/model/types.ts:43-46`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Distance and keyboard train UIs bind `config.intervalRange.minSemitones` and allow `0..12` in [`src/app/train/distance/distance-train-client.tsx:640-679`](src/app/train/distance/distance-train-client.tsx) and [`src/app/train/keyboard/keyboard-train-client.tsx:648-687`](src/app/train/keyboard/keyboard-train-client.tsx).
  - Validation only checks `minSemitones <= maxSemitones`; it does not enforce the product max of `11` in [`src/features/training/model/distance-guest.ts:115-140`](src/features/training/model/distance-guest.ts) and [`src/features/training/model/keyboard-guest.ts:86-111`](src/features/training/model/keyboard-guest.ts).
- Persistence/storage impact:
  - `user_settings.last_*_config` and `training_sessions.config_snapshot` persist the plural runtime shape because both columns are typed from the code model in [`src/lib/db/schema/app.ts:44-60`](src/lib/db/schema/app.ts) and [`src/lib/db/schema/app.ts:84-91`](src/lib/db/schema/app.ts).
  - Settings/session snapshot UIs also read the plural shape in [`src/app/settings/page.tsx:193-226`](src/app/settings/page.tsx) and [`src/app/sessions/[sessionId]/page.tsx:112-116`](src/app/sessions/[sessionId]/page.tsx).
- Audit status:
  - Source conflict requiring human choice: singular naming in docs vs plural naming in runtime/storage, plus `0..11` vs current UI allowance up to `12`.

### `intervalRange.maxSemitone`

- Product source:
  - Canonical field name is singular `maxSemitone`, with allowed range `1..12`, in [`docs/product/requirements.md:383`](docs/product/requirements.md) and [`docs/product/basic-design.md:235-238`](docs/product/basic-design.md).
- Implementation docs:
  - `docs/implementation/ts-types.md` also uses singular `maxSemitone` in [`docs/implementation/ts-types.md:68-71`](docs/implementation/ts-types.md).
- Code/type definition:
  - Runtime type uses plural `maxSemitones` in [`src/features/training/model/types.ts:43-46`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Both train UIs bind `maxSemitones` and clamp to `1..12` in [`src/app/train/distance/distance-train-client.tsx:661-679`](src/app/train/distance/distance-train-client.tsx) and [`src/app/train/keyboard/keyboard-train-client.tsx:669-687`](src/app/train/keyboard/keyboard-train-client.tsx).
  - Validation checks ordering only, not the full documented range, in [`src/features/training/model/distance-guest.ts:115-140`](src/features/training/model/distance-guest.ts) and [`src/features/training/model/keyboard-guest.ts:86-111`](src/features/training/model/keyboard-guest.ts).
- Persistence/storage impact:
  - The persisted JSON snapshot shape is plural for the same reasons as `minSemitone`, via [`src/lib/db/schema/app.ts:44-60`](src/lib/db/schema/app.ts) and [`src/lib/db/schema/app.ts:84-91`](src/lib/db/schema/app.ts).
- Audit status:
  - Source conflict requiring human choice on field naming. Range/default are effectively aligned.

### `directionMode`

- Product source:
  - Canonical values are `up_only | mixed` in [`docs/product/requirements.md:384`](docs/product/requirements.md) and clarified in [`docs/product/requirements.md:397-399`](docs/product/requirements.md).
- Implementation docs:
  - Implementation docs use the same union in [`docs/implementation/ts-types.md:38`](docs/implementation/ts-types.md).
- Code/type definition:
  - Runtime type matches in [`src/features/training/model/types.ts:17`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Both train UIs expose `mixed` and `up_only` and default to `mixed` in [`src/features/training/model/distance-guest.ts:54-71`](src/features/training/model/distance-guest.ts), [`src/features/training/model/keyboard-guest.ts:53-69`](src/features/training/model/keyboard-guest.ts), [`src/app/train/distance/distance-train-client.tsx:682-698`](src/app/train/distance/distance-train-client.tsx), and [`src/app/train/keyboard/keyboard-train-client.tsx:690-706`](src/app/train/keyboard/keyboard-train-client.tsx).
- Persistence/storage impact:
  - Stored in both last-used config JSON and session config snapshots through the typed `TrainingConfig` JSON fields.
- Audit status:
  - Aligned.

### `includeUnison`

- Product source:
  - Present, visible, boolean, default `false` in [`docs/product/requirements.md:385`](docs/product/requirements.md).
- Implementation docs:
  - Present in the implementation-facing shape in [`docs/implementation/ts-types.md:91-92`](docs/implementation/ts-types.md).
- Code/type definition:
  - Present in [`src/features/training/model/types.ts:67-68`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Default is `false` in both mode defaults in [`src/features/training/model/distance-guest.ts:61-70`](src/features/training/model/distance-guest.ts) and [`src/features/training/model/keyboard-guest.ts:60-68`](src/features/training/model/keyboard-guest.ts).
  - Exposed by both train UIs in [`src/app/train/distance/distance-train-client.tsx:744-762`](src/app/train/distance/distance-train-client.tsx) and [`src/app/train/keyboard/keyboard-train-client.tsx:752-770`](src/app/train/keyboard/keyboard-train-client.tsx).
- Persistence/storage impact:
  - Stored inside the JSON config snapshots used by `user_settings` and `training_sessions`.
- Audit status:
  - Aligned.

### `includeOctave`

- Product source:
  - Present, visible, boolean, default `true` in [`docs/product/requirements.md:386`](docs/product/requirements.md).
- Implementation docs:
  - Present in [`docs/implementation/ts-types.md:91-92`](docs/implementation/ts-types.md).
- Code/type definition:
  - Present in [`src/features/training/model/types.ts:67-68`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Default is `true` in both mode defaults in [`src/features/training/model/distance-guest.ts:61-70`](src/features/training/model/distance-guest.ts) and [`src/features/training/model/keyboard-guest.ts:60-68`](src/features/training/model/keyboard-guest.ts).
  - Exposed by both train UIs in [`src/app/train/distance/distance-train-client.tsx:764-782`](src/app/train/distance/distance-train-client.tsx) and [`src/app/train/keyboard/keyboard-train-client.tsx:772-790`](src/app/train/keyboard/keyboard-train-client.tsx).
- Persistence/storage impact:
  - Stored inside `last_*_config` and `config_snapshot` JSON.
- Audit status:
  - Aligned.

### `baseNoteMode`

- Product source:
  - Canonical values are `fixed | random`, default `random`, in [`docs/product/requirements.md:387`](docs/product/requirements.md).
- Implementation docs:
  - Same union appears in [`docs/implementation/ts-types.md:40`](docs/implementation/ts-types.md) and [`docs/implementation/ts-types.md:87-96`](docs/implementation/ts-types.md).
- Code/type definition:
  - Same union appears in [`src/features/training/model/types.ts:15`](src/features/training/model/types.ts) and [`src/features/training/model/types.ts:63-71`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Defaults are `random` in both mode defaults in [`src/features/training/model/distance-guest.ts:61-70`](src/features/training/model/distance-guest.ts) and [`src/features/training/model/keyboard-guest.ts:60-68`](src/features/training/model/keyboard-guest.ts).
  - Both train UIs expose `random` and `fixed` in [`src/app/train/distance/distance-train-client.tsx:700-720`](src/app/train/distance/distance-train-client.tsx) and [`src/app/train/keyboard/keyboard-train-client.tsx:708-728`](src/app/train/keyboard/keyboard-train-client.tsx).
- Persistence/storage impact:
  - Stored inside config JSON snapshots.
- Audit status:
  - Aligned.

### `fixedBaseNote`

- Product source:
  - Canonical type is `string | null`, using the 12 pitch classes, with default `C` when active and `null` otherwise, in [`docs/product/requirements.md:388`](docs/product/requirements.md).
- Implementation docs:
  - Basic design makes the field optional (`fixedBaseNote?: string`) in [`docs/product/basic-design.md:242-249`](docs/product/basic-design.md).
  - `docs/implementation/ts-types.md` makes it required but nullable in [`docs/implementation/ts-types.md:93-95`](docs/implementation/ts-types.md).
- Code/type definition:
  - Runtime type is required but nullable `NoteClass | null` in [`src/features/training/model/types.ts:69-71`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Both mode defaults start as `null` while `baseNoteMode = "random"` in [`src/features/training/model/distance-guest.ts:61-70`](src/features/training/model/distance-guest.ts) and [`src/features/training/model/keyboard-guest.ts:60-68`](src/features/training/model/keyboard-guest.ts).
  - When the user switches to `fixed`, the UI normalizes missing values to `"C"` in [`src/app/train/distance/distance-train-client.tsx:705-714`](src/app/train/distance/distance-train-client.tsx) and [`src/app/train/keyboard/keyboard-train-client.tsx:713-722`](src/app/train/keyboard/keyboard-train-client.tsx).
- Persistence/storage impact:
  - Stored as the runtime nullable field in the JSON snapshots used by `user_settings` and `training_sessions`.
  - Settings/session snapshot UIs assume the nullable shape in [`src/app/settings/page.tsx:203-205`](src/app/settings/page.tsx) and [`src/app/sessions/[sessionId]/page.tsx:123-145`](src/app/sessions/[sessionId]/page.tsx).
- Audit status:
  - Doc drift, but not a policy conflict by itself. The main mismatch is optional-vs-nullable representation across docs.

### `endCondition.type`

- Product source:
  - Canonical values are `question_count | time_limit`, default `question_count`, in [`docs/product/requirements.md:389`](docs/product/requirements.md).
- Implementation docs:
  - Same union is used in [`docs/implementation/ts-types.md:41`](docs/implementation/ts-types.md) and [`docs/implementation/ts-types.md:73-85`](docs/implementation/ts-types.md).
- Code/type definition:
  - Same union is used in [`src/features/training/model/types.ts:11`](src/features/training/model/types.ts) and [`src/features/training/model/types.ts:48-61`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Both train UIs expose question-count and time-limit choices and default to question-count in [`src/features/training/model/distance-guest.ts:66-70`](src/features/training/model/distance-guest.ts), [`src/features/training/model/keyboard-guest.ts:65-68`](src/features/training/model/keyboard-guest.ts), [`src/app/train/distance/distance-train-client.tsx:580-595`](src/app/train/distance/distance-train-client.tsx), and [`src/app/train/keyboard/keyboard-train-client.tsx:588-603`](src/app/train/keyboard/keyboard-train-client.tsx).
- Persistence/storage impact:
  - Stored both as explicit `training_sessions.end_condition_type` and inside `config_snapshot` in [`src/lib/db/schema/app.ts:81-91`](src/lib/db/schema/app.ts) and described in [`docs/implementation/db-schema.md:77-83`](docs/implementation/db-schema.md).
- Audit status:
  - Aligned.

### `endCondition.questionCount`

- Product source:
  - Canonical range is `5..50`, used only when `type = question_count`, with default `10`, in [`docs/product/requirements.md:390`](docs/product/requirements.md).
- Implementation docs:
  - The implementation docs define the field but do not carry the product range into the type shape in [`docs/implementation/ts-types.md:73-85`](docs/implementation/ts-types.md).
- Code/type definition:
  - Runtime type stores `questionCount: number` in [`src/features/training/model/types.ts:48-50`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Defaults match `10` in both mode defaults in [`src/features/training/model/distance-guest.ts:66-70`](src/features/training/model/distance-guest.ts) and [`src/features/training/model/keyboard-guest.ts:65-68`](src/features/training/model/keyboard-guest.ts).
  - Both train UIs clamp to `1..20`, not `5..50`, in [`src/app/train/distance/distance-train-client.tsx:598-617`](src/app/train/distance/distance-train-client.tsx) and [`src/app/train/keyboard/keyboard-train-client.tsx:606-625`](src/app/train/keyboard/keyboard-train-client.tsx).
  - Validation only requires `> 0`, not the documented `5..50`, in [`src/features/training/model/distance-guest.ts:126-131`](src/features/training/model/distance-guest.ts) and [`src/features/training/model/keyboard-guest.ts:97-102`](src/features/training/model/keyboard-guest.ts).
- Persistence/storage impact:
  - Stored in config JSON snapshots and normalized into `training_sessions.planned_question_count` by [`src/features/training/model/persistence.ts:48-63`](src/features/training/model/persistence.ts).
  - DB constraints only require non-negative or presence for the matching end-condition type in [`src/lib/db/schema/app.ts:90-110`](src/lib/db/schema/app.ts) and [`docs/implementation/db-schema.md:80-103`](docs/implementation/db-schema.md).
- Audit status:
  - Source conflict requiring human choice: product range is narrower and higher than current UI/validation behavior.

### `endCondition.timeLimitSeconds`

- Product source:
  - Canonical field name and unit are `timeLimitSeconds`, with range `60..1800` and default `180`, in [`docs/product/requirements.md:391`](docs/product/requirements.md), [`docs/product/requirements.md:406`](docs/product/requirements.md), and [`docs/product/basic-design.md:245-249`](docs/product/basic-design.md).
- Implementation docs:
  - `docs/implementation/ts-types.md` uses `timeLimitSeconds` in [`docs/implementation/ts-types.md:78-85`](docs/implementation/ts-types.md).
  - `docs/implementation/api-contracts.md` says `getInitialTrainingConfig` returns `endCondition.timeLimitSeconds` and `saveTrainingSession` persists from `endCondition.timeLimitSeconds` in [`docs/implementation/api-contracts.md:97-100`](docs/implementation/api-contracts.md) and [`docs/implementation/api-contracts.md:155-157`](docs/implementation/api-contracts.md).
  - `docs/implementation/training-flow.md` also states `endCondition.timeLimitSeconds` for the session-wide timer in [`docs/implementation/training-flow.md:56-62`](docs/implementation/training-flow.md).
- Code/type definition:
  - Runtime type uses `timeLimitMinutes` instead in [`src/features/training/model/types.ts:53-61`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Both train UIs expose `制限時間（分）`, default to `3`, and clamp to `1..30` minutes in [`src/app/train/distance/distance-train-client.tsx:586-637`](src/app/train/distance/distance-train-client.tsx) and [`src/app/train/keyboard/keyboard-train-client.tsx:594-645`](src/app/train/keyboard/keyboard-train-client.tsx).
  - Both mode validators enforce `timeLimitMinutes > 0`, not `timeLimitSeconds` in the documented `60..1800` range, in [`src/features/training/model/distance-guest.ts:133-138`](src/features/training/model/distance-guest.ts) and [`src/features/training/model/keyboard-guest.ts:104-109`](src/features/training/model/keyboard-guest.ts).
  - The runtime session timer also reads `timeLimitMinutes * 60 * 1000` in the train clients (`src/app/train/distance/distance-train-client.tsx:346-350`, `src/app/train/keyboard/keyboard-train-client.tsx:356-360`).
- Persistence/storage impact:
  - `training_sessions.planned_time_limit_seconds` is derived from `timeLimitMinutes * 60` in [`src/features/training/model/persistence.ts:48-56`](src/features/training/model/persistence.ts), so the relational columns stay second-based even while `config_snapshot` and `user_settings.last_*_config` stay minute-based.
  - Settings/session snapshot displays also assume `timeLimitMinutes` in [`src/app/settings/page.tsx:205-214`](src/app/settings/page.tsx), [`src/app/settings/page.tsx:247-252`](src/app/settings/page.tsx), and [`src/app/sessions/[sessionId]/page.tsx:141-146`](src/app/sessions/[sessionId]/page.tsx).
- Audit status:
  - Highest-priority source conflict requiring human choice. This is a field-name drift, unit drift, UI drift, validation drift, and persisted JSON-shape drift all at once.

### `intervalGranularity`

- Product source:
  - Distance-only field, values `simple | aug_dim`, default `simple`, in [`docs/product/requirements.md:392`](docs/product/requirements.md) and [`docs/product/requirements.md:400-401`](docs/product/requirements.md).
- Implementation docs:
  - Same union appears in [`docs/implementation/ts-types.md:47`](docs/implementation/ts-types.md) and the distance-only extension in [`docs/implementation/ts-types.md:98-105`](docs/implementation/ts-types.md).
- Code/type definition:
  - Runtime type requires it on `DistanceTrainingConfig` and omits it on `KeyboardTrainingConfig` in [`src/features/training/model/types.ts:74-83`](src/features/training/model/types.ts).
- UI/default/validation behavior:
  - Distance defaults to `simple` and the distance UI exposes the toggle in [`src/features/training/model/distance-guest.ts:54-71`](src/features/training/model/distance-guest.ts) and [`src/app/train/distance/distance-train-client.tsx:784-800`](src/app/train/distance/distance-train-client.tsx).
  - Keyboard mode adds no extra config field, matching the product rule in [`docs/product/requirements.md:396`](docs/product/requirements.md).
- Persistence/storage impact:
  - Stored only when the mode is `distance`, via the typed JSON snapshots in `user_settings` and `training_sessions`.
- Audit status:
  - Aligned in meaning. Minor doc drift remains because `docs/product/basic-design.md:244-249` sketches it as optional on the generic `TrainingConfig`.

## Cross-Cutting Findings

### 1. Snapshot shape currently follows code, not product docs

- `user_settings.last_distance_config`, `user_settings.last_keyboard_config`, and `training_sessions.config_snapshot` are typed directly from the runtime config model in [`src/lib/db/schema/app.ts:44-60`](src/lib/db/schema/app.ts) and [`src/lib/db/schema/app.ts:84-91`](src/lib/db/schema/app.ts).
- That means any choice about singular vs plural interval keys or seconds vs minutes is not just a UI concern. It changes the JSON shape persisted for settings and saved sessions.
- The repo-level schema docs already describe `config_snapshot` as storing the canonical `TrainingConfig`, so the canonical choice cannot stay ambiguous forever in [`docs/implementation/db-schema.md:159-171`](docs/implementation/db-schema.md).

### 2. Persistence columns partially mask the time-unit mismatch

- The structured DB columns use `planned_time_limit_seconds`, and the pure persistence mapper converts `timeLimitMinutes * 60` before insert in [`src/features/training/model/persistence.ts:48-56`](src/features/training/model/persistence.ts).
- This keeps the relational column compatible with the product wording, but the JSON snapshots and UI props still remain minute-based.
- Result: the repo currently has two simultaneous time-limit contracts depending on whether the reader looks at explicit columns or config JSON.

### 3. Duplicate config read-models increase drift risk

- The settings snapshot component and session detail page both restate the config shape inline, including `minSemitones`, `maxSemitones`, and `timeLimitMinutes`, in [`src/app/settings/page.tsx:193-215`](src/app/settings/page.tsx) and [`src/app/sessions/[sessionId]/page.tsx:106-158`](src/app/sessions/[sessionId]/page.tsx).
- As long as these pages duplicate the runtime contract instead of importing a shared read-model, contract changes will need coordinated edits across UI consumers even after a source-of-truth choice is made.

## Prioritized Decision List

### Safe Follow-Up Alignment Work

1. Replace duplicated snapshot prop shapes in `src/app/settings/page.tsx` and `src/app/sessions/[sessionId]/page.tsx` with a shared imported config/read-model type so future contract changes only need one runtime edit path.
2. Add an explicit contract note near persistence mapping or schema comments that the current DB columns are second-based while the current runtime config JSON is minute-based, so this mismatch stays visible until the canonical contract is chosen.

### Blocked On Human Source-Of-Truth Choice

1. Canonical time-limit field and unit:
   - Choose whether the product-facing contract is `endCondition.timeLimitSeconds` or the current runtime `endCondition.timeLimitMinutes`.
   - This choice affects type names, train UIs, validation, settings/session snapshot displays, persisted JSON snapshots, and future compatibility handling.
2. Canonical interval-range key names:
   - Choose whether the contract uses `minSemitone` / `maxSemitone` or the current runtime `minSemitones` / `maxSemitones`.
   - This affects `TrainingConfig` types, config snapshots, settings/session displays, and any saved JSON already created.
3. Canonical question-count and time-limit ranges:
   - Product docs require `questionCount = 5..50` and `timeLimitSeconds = 60..1800`, while the current UI/validation allow `1..20` questions and `1..30` minutes.
   - This is a policy choice, not just a naming fix.
4. Canonical upper bound for `intervalRange.min*`:
   - Product docs cap the minimum at `11`, while the current UI allows `12`.
   - This needs an explicit decision before tightening validation or leaving the current UX as-is.

## Recommended Next Bundles

1. `TrainingConfig` contract alignment
   - Apply the human-approved canonical field names, units, and numeric bounds across product docs, implementation docs, types, train UI, validation, and persistence mapping.
2. TrainingConfig snapshot follow-through
   - Update settings/session detail rendering and any shared config-read models to match the approved contract in one place.
3. Contract guardrails
   - Add targeted tests for the approved `TrainingConfig` ranges and persistence normalization so future drift is caught automatically.
