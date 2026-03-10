# ミーコピ MVP Requirements

## Product Summary

- Product name: ミーコピ
- MVP target: Web application
- Primary goal: support relative pitch training oriented toward ear-copy practice
- Assumption: users train with a reference tone available

## Target Users

- People who want to improve relative pitch for ear-copy workflows
- Learners who can compare heard pitch against a reference tone
- Users who want lightweight web-based practice without DAW integration in the MVP

## Product Policy

- Focus the MVP on short training sessions with repeatable feedback loops.
- Treat pitch error and answer speed as the core evaluation axes.
- Generate sound on the client with the Web Audio API.
- Do not access the DB while a question is being answered.
- Save session data only once, when the session ends.
- Persist session data only for authenticated users.
- Guest sessions are playable but are never saved.
- Guest results are not backfilled after later login.

## In Scope For MVP

- Google sign-in via Better Auth
- Training configuration before a session starts
- Training session flow on a single `/train` route with internal state switching
- Question playback and answer input in the browser
- Per-question feedback
- Session result summary
- Guest training without persistence
- User settings load/update
- Home summary and stats views backed by on-read aggregation

## Out Of Scope For MVP

- Native mobile applications
- Real-time collaborative features
- Background jobs for pre-aggregation
- Advanced analytics beyond session/question level trends
- External MIDI device support
- DAW/plugin integration
- Guest-result save or post-login backfill

## Core Evaluation Principles

- Relative pitch improvement is the primary learning objective.
- Ear-copy orientation is prioritized over music theory coverage breadth.
- A reference tone is assumed to exist during training.
- Scoring must reflect both pitch accuracy and response time.

## MVP TrainingConfig

The MVP `TrainingConfig` consists of the following canonical items. The `UI` column shows whether each item is user-visible or internal-only.

| Item | Scope | Type | Range / Allowed Values | Default | UI |
| --- | --- | --- | --- | --- | --- |
| `mode` | common | enum | `distance \| keyboard` | `distance` | visible |
| `intervalRange.minSemitones` | common | integer | `0..11` | `0` | visible |
| `intervalRange.maxSemitones` | common | integer | `1..12` and `min <= max` | `12` | visible |
| `directionMode` | common | enum | `up_only \| mixed` | `mixed` | visible |
| `includeUnison` | common | boolean | `true \| false` | `false` | visible |
| `includeOctave` | common | boolean | `true \| false` | `true` | visible |
| `baseNoteMode` | common | enum | `fixed \| random` | `random` | visible |
| `fixedBaseNote` | common | `string \| null` | note class `C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`; used only when `baseNoteMode = fixed` | `C` when active, otherwise `null` | conditional |
| `endCondition.type` | common | enum | `question_count \| time_limit` | `question_count` | visible |
| `endCondition.questionCount` | common | integer | `5..50`; used only when `type = question_count` | `10` when active | conditional |
| `endCondition.timeLimitMinutes` | common | integer | `1..30`; session-wide limit, used only when `type = time_limit` | `3` when active | conditional |
| `intervalGranularity` | distance only | enum | `simple \| aug_dim` | `simple` | conditional |

Rules:

- `keyboard` mode adds no extra MVP config fields.
- `intervalGranularity = "simple"` means minor / major / perfect intervals only.
- `intervalGranularity = "aug_dim"` means minor / major / perfect intervals plus augmented fourth and diminished fifth.
- The effective interval candidate set must not become empty after applying `intervalRange`, `includeUnison`, and `includeOctave`.
- `referencePitchHz` is fixed at `440` in the MVP and is not part of `TrainingConfig`.
- `endCondition.timeLimitMinutes` is a session-wide limit, not a per-question timer.
- Replay is always allowed in the MVP and has no count limit, so it is not part of `TrainingConfig`.
- Timeout UI remains a small note-level notice and is not configurable in the MVP.
