# ミーコピ MVP Requirements

## Product Summary

- Product name: ミーコピ
- MVP target: Web application
- Primary goal: support relative-pitch training oriented toward ear-copy practice
- Core MVP focus: single-note training with a reference tone available
- Primary device priority: smartphone browser in portrait orientation

## Target Users

- People who want to improve relative pitch for ear-copy workflows
- Learners who can compare heard pitch against a reference tone
- Users who want lightweight web-based practice without DAW integration in the MVP
- Beginners to early intermediate users who should be able to start without deep music theory knowledge

## Product Policy

- Focus the MVP on short, repeatable training sessions with fast feedback loops.
- Treat pitch error and answer speed as the core evaluation axes.
- Use a product-specific score as the primary headline metric, while preserving raw data for future recalculation.
- Generate and play sound on the client with the Web Audio API.
- Use a fixed piano timbre in the MVP.
- Do not access the DB while a question is being played or answered.
- Save session data only once, when the session ends.
- Persist session data only for authenticated users.
- Guest sessions are playable but are never saved.
- Guest results are not backfilled after later login.
- Keep training UX fast and low-friction on mobile.

## Technical / Architecture Constraints

- Frontend: Next.js App Router + TypeScript
- Auth: Better Auth + Google OAuth
- Database: PostgreSQL
- ORM / schema management: Drizzle ORM
- Hosting assumption for MVP: Vercel + Neon
- App-specific tables must be separated from auth tables
- The app must not maintain a duplicate custom users table when Better Auth already provides the user parent record
- Internal app APIs should prefer Server Actions / Server Functions over adding unnecessary REST endpoints

## In Scope For MVP

- Google sign-in via Better Auth
- Guest start without login
- Mode-specific training start for:
  - distance mode
  - keyboard mode
- Training configuration before a session starts
- Training session flow with internal state switching inside the training route
- Automatic playback of reference tone then target tone
- Manual replay buttons for reference tone and target tone
- In-browser answer input
- Per-question feedback
- Session result summary
- User settings load/update
- Authenticated result persistence
- Home summary for logged-in users
- Stats view for logged-in users
- On-read aggregation for stats in the MVP

## Out Of Scope For MVP

- Native mobile applications
- Email/password authentication
- Real-time collaborative features
- Background jobs for pre-aggregation
- Advanced analytics beyond session/question level trends
- Adaptive difficulty based on user performance history
- External MIDI device support
- DAW/plugin integration
- Server-side bulk audio asset delivery
- Guest-result save or post-login backfill
- Absolute-pitch training
- Rhythm training
- Singing training
- Chord / harmony training

## Core Evaluation Principles

- Relative-pitch improvement is the primary learning objective.
- Ear-copy orientation is prioritized over broad music-theory coverage.
- A reference tone is assumed to exist during training.
- Scoring must reflect both pitch accuracy and response time.
- The data model must preserve enough raw information to allow future score-formula changes and recalculation.

## MVP Training Modes

### Distance Mode
- The user answers by interval name relative to the reference tone.
- The answer UI is selection-based.
- Direction is not encoded in the label text itself; direction may be conveyed by layout.
- The displayed correct answer in feedback is the interval name, not the target note name.
- Interval granularity is configurable in this mode.

### Keyboard Mode
- The user answers by selecting the target note on an on-screen keyboard.
- The keyboard must include black keys.
- Feedback must distinguish the answered key from the correct key.
- Feedback must also show note names in text.

## Training Session Flow

A training session must support the following internal phases:

- config
- preparing
- playing
- answering
- feedback
- result

Expected flow:

`config -> preparing -> playing -> answering -> feedback -> (next question -> playing) or (session end -> result)`

Session end conditions:

- target question count reached
- time limit reached
- manual end by user

Time-limit rule:

- If the time limit is reached during an unanswered question, that in-progress unanswered question is discarded.
- Only completed questions are aggregated into the result.

## Question Playback Requirements

- On each question, the app must automatically play `reference tone -> target tone`.
- On the web MVP, the training start action should be used as the initial audio-unlock gesture when possible.
- A dedicated "tap to start audio" screen should not be required unless browser restrictions force a fallback.
- The user must be able to replay the reference tone individually.
- The user must be able to replay the target tone individually.
- There is no combined replay button in the MVP.
- Playback requests issued while audio is already playing must be ignored.
- Sounds must not overlap due to repeated replay taps.
- The playback order is always `reference tone -> target tone`.
- Tone length should be medium by default.
- The gap between reference tone and target tone should be medium by default.
- The MVP handles single-note questions only.

## Question Generation Requirements

- Distance mode and keyboard mode share the same common interval-range settings.
- The initial default range should cover a full one-octave practical range in the MVP.
- Upward and downward intervals must be supportable through configuration.
- Unison must be optionally includable or excludable.
- Octave must be optionally includable or excludable.
- Base note can be fixed or randomized.
- Fixed base note options must cover all 12 pitch classes.
- Randomized base note changes note name only; octave position remains fixed in the MVP.
- Randomized base note options must cover all 12 pitch classes.
- The randomized base octave should stay around the C4 midrange.
- Candidate generation should be derived from the config once per session / start context, not reinvented ad hoc every question.
- Effective candidates must be distributed as evenly as practical.
- Light bias control is allowed:
  - do not control repeated direction
  - prevent the same interval distance from appearing more than twice in a row when possible
- If bias control would eliminate all candidates, the app may temporarily relax the bias rule.

## Answer Requirements

### Common
- A single tap should immediately finalize the answer.
- Judgement should be returned immediately after the answer.
- Response time must be measured.
- Response time starts when playback of the target tone finishes.
- Time spent on manual replays still counts toward response time.

### Distance Mode
- The answer is based on interval naming.
- Interval notation style is user-configurable:
  - Japanese
  - abbreviation
  - mixed
- The MVP default notation style is Japanese.
- Interval granularity is configurable:
  - `simple`
  - `aug_dim`
- `simple` means minor / major / perfect only.
- `aug_dim` adds augmented fourth and diminished fifth.
- In the MVP, augmented fourth and diminished fifth are treated as one unified answer candidate.
- The unified label is `増4度 / 減5度`.
- A degree-only answer mode is not included in the MVP.

### Keyboard Mode
- The answer is the target note on the keyboard UI.
- Full chromatic keyboard input is assumed, including black keys.

## Feedback Requirements

### Common
- Feedback must show correct / incorrect status.
- Feedback must show the correct content appropriate to the mode.
- Feedback must show the user’s answer.
- Feedback must show response time.
- Feedback must allow replay of the correct target tone.
- Feedback may also allow replay of the reference tone.
- The user advances to the next question by user action.
- The user can also choose to end the session from feedback.

### Distance Mode
- Show the correct interval name, not the correct target note name.
- Show:
  - correct interval name
  - answered interval name
  - signed error
- Signed error must clearly indicate higher/lower direction, e.g. `+1 semitone`, `-2 semitones`.

### Keyboard Mode
- Show the correct note name and the answered note name in text.
- Distinguish correct key and answered key visually on the keyboard.
- Error does not need a signed semitone text label in the MVP if the keyboard relationship is visually clear.
- Black-key note text may display both sharp and flat forms, e.g. `C#(Db)`.
- Note-name text should omit octave number in feedback display.
- If the answer is correct, the success state may be merged into one combined correct display.

## Session Result Requirements

- At session end, show a result summary for the completed questions.
- The session score must be the primary headline metric.
- The result screen should also include:
  - answer count summary
  - correct rate
  - average error
  - average response time
- Guest results must clearly indicate that the result is not saved.
- Guest result screens must provide a clear login CTA for future saved use.
- Guest results are not temporarily cached for later post-login save.

## Persistence Requirements

### Guest Use
- Do not save session results to the cloud.
- Session results may be shown in-memory/on-screen only.
- Do not backfill guest results after later login.
- Guest settings may be kept locally in the browser only.

### Authenticated Use
- Save the session only once, at the end of the session.
- Save one training session row plus multiple question result rows atomically.
- Persist user settings to the cloud.
- Treat authenticated use as online-only for cloud-backed history and stats.

### Save Payload Requirements
The persisted data must preserve enough detail for later analysis and score recalculation.

Per session, save at least:

- mode
- startedAt
- endedAt
- finishReason
- endCondition snapshot
- config snapshot
- scoreFormulaVersion
- session-level score summary

Per answered question, save at least:

- questionIndex
- answeredAt
- base note
- target note
- answered note or answered interval
- target interval semitones
- answered interval semitones where applicable
- direction
- correctness
- error in semitones
- responseTimeMs
- replayBaseCount
- replayTargetCount
- per-question score

Additional rules:

- Save enough raw information to support future score recalculation.
- Replay counts are stored for analysis in the MVP.
- Replay counts do not affect the MVP score formula.
- Replay counts do not need to be shown in the MVP user-facing UI.

## Scoring Requirements

- The app must compute a per-question score.
- The app must compute a session-total score.
- The app must expose a cumulative score for logged-in users.
- In the MVP, cumulative score may be a simple accumulation model.
- The score must consider at least:
  - pitch error
  - response time
  - difficulty implied by target interval distance
- Close but incorrect answers should still be representable in the data model for partial-credit-friendly future formulas.
- The score formula must be versioned.
- The score formula should be adjustable in future versions without invalidating previously saved raw data.

## Stats / Growth Visualization Requirements

### MVP Required
- overall correct rate
- average error
- median error
- average response time
- recent 10 / 30 question summaries for score, error, and response time
- daily trend views using average-based aggregation
- cumulative score display

### High Priority Within MVP
- per-interval performance
- upward vs downward performance
- tendency to answer too high vs too low
- score trend
- mode-specific comparison between distance mode and keyboard mode

### Acceptable To Defer Beyond Initial MVP Iteration
- error distribution graph
- automatic weak-interval extraction
- skill/rank system derived from score

### Access Rules
- Stats are available only to authenticated users.
- Guest users do not get growth/stat screens.

## Home Requirements

### Logged-in Home
The home screen should provide a lightweight summary and clear next actions.

Display at least:

- last training time
- last used mode
- latest session score
- average error based on recent sessions
- average response time based on recent sessions
- entry points to distance mode and keyboard mode
- entry point to stats
- entry point to settings
- logout action

### Guest Home
Display at least:

- entry point to distance mode
- entry point to keyboard mode
- entry point to login
- entry point to settings

Stats-related summary blocks should be hidden for guests.

## Settings Requirements

Global settings in the MVP include at least:

- master volume
- sound effects on/off
- interval notation style
- keyboard note-label visibility on/off

Save policy:

- Reflect changes immediately in the UI.
- For authenticated users, persist them to the cloud.
- For guests, keep them in browser-local storage only.
- In authenticated mode, preserve the latest value as the final saved value even if the user changes settings repeatedly in one screen flow.

Failure handling:

- If settings save fails, keep the visible UI value.
- Show a small toast or inline failure notice.
- Keep the latest value retryable.

## MVP TrainingConfig

The MVP `TrainingConfig` consists of the following canonical items. The `UI` column shows whether each item is user-visible or internal-only.

| Item | Scope | Type | Range / Allowed Values | Default | UI |
| --- | --- | --- | --- | --- | --- |
| `mode` | common | enum | `distance \| keyboard` | `distance` | visible |
| `intervalRange.minSemitone` | common | integer | `0..11` | `0` | visible |
| `intervalRange.maxSemitone` | common | integer | `1..12` and `min <= max` | `12` | visible |
| `directionMode` | common | enum | `up_only \| mixed` | `mixed` | visible |
| `includeUnison` | common | boolean | `true \| false` | `false` | visible |
| `includeOctave` | common | boolean | `true \| false` | `true` | visible |
| `baseNoteMode` | common | enum | `fixed \| random` | `random` | visible |
| `fixedBaseNote` | common | `string \| null` | pitch class `C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`; used only when `baseNoteMode = fixed` | `C` when active, otherwise `null` | conditional |
| `endCondition.type` | common | enum | `question_count \| time_limit` | `question_count` | visible |
| `endCondition.questionCount` | common | integer | `5..50`; used only when `type = question_count` | `10` when active | conditional |
| `endCondition.timeLimitSeconds` | common | integer | `60..1800`; session-wide limit, used only when `type = time_limit` | `180` when active | conditional |
| `intervalGranularity` | distance only | enum | `simple \| aug_dim` | `simple` | conditional |

## TrainingConfig Rules

- `keyboard` mode adds no extra MVP config fields.
- `directionMode = up_only` means upward intervals only.
- `directionMode = mixed` means both upward and downward intervals are allowed.
- UI copy may describe `mixed` in more user-friendly wording such as “下行あり” or equivalent, but the canonical internal config value is `mixed`.
- `intervalGranularity = simple` means minor / major / perfect intervals only.
- `intervalGranularity = aug_dim` means minor / major / perfect intervals plus the unified augmented-fourth / diminished-fifth candidate.
- The effective interval candidate set must not become empty after applying `intervalRange`, `includeUnison`, and `includeOctave`.
- `referencePitchHz` is fixed at `440` in the MVP and is not part of `TrainingConfig`.
- Replay is always allowed in the MVP and has no count limit, so it is not part of `TrainingConfig`.
- Timeout UI remains a small note-level notice and is not configurable in the MVP.
- Time-limit configuration is session-wide, not per-question.
- The training route should keep session progress in client state rather than depending on DB round-trips during play.

## Non-Goals For Data / Infra In MVP

- No background pre-aggregation job is required initially.
- Stats may be computed on read in the MVP.
- If performance later becomes a problem, aggregated tables or caches may be introduced in a later phase.