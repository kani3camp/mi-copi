# Scoring

Canonical source:
- This document defines the exact v1 score formula used by `score_formula_version = "v1"`.
- Product intent comes from `docs/product/requirements.md` and `docs/product/basic-design.md`.
- Persistence field names come from `docs/implementation/db-schema.md` and `docs/implementation/ts-types.md`.

Related docs:
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/implementation/training-flow.md`
- `docs/implementation/db-schema.md`
- `docs/implementation/ts-types.md`

This document decides:
- per-question score inputs and multiplier tables
- session summary aggregate formulas
- rounding and persistence rules

This document does not decide:
- replay penalties
- adaptive difficulty
- rank / badge / skill systems

## Score Version

- `score_formula_version = "v1"`

## v1 Intent

The MVP score is not a pure correct-rate metric.
It weights three axes together so that close errors, slow answers, and harder intervals are all visible in the result:

- `errorSemitones`
- `responseTimeMs`
- `targetIntervalSemitones`

## Per-Question Formula

For each answered question:

```txt
questionScore =
  round3(
    100
    * errorMultiplier
    * timeMultiplier
    * intervalDifficultyMultiplier
  )
```

Where:

- `errorMultiplier` uses `abs(errorSemitones)`
- `timeMultiplier` uses `responseTimeMs`
- `intervalDifficultyMultiplier` uses `abs(targetIntervalSemitones)`

## Multiplier Tables

### `errorMultiplier`

| Absolute `errorSemitones` | Multiplier |
| --- | --- |
| `0` | `1.000` |
| `1` | `0.550` |
| `2` | `0.250` |
| `>= 3` | `0.000` |

### `timeMultiplier`

`responseTimeMs` is measured from the end of target-tone playback and includes manual replay time.

| `responseTimeMs` | Multiplier |
| --- | --- |
| `<= 2_000` | `1.200` |
| `<= 4_000` | `1.000` |
| `<= 7_000` | `0.850` |
| `> 7_000` | `0.700` |

### `intervalDifficultyMultiplier`

`targetIntervalSemitones` is mapped into the v1 interval bucket below.
Because the MVP treats augmented fourth / diminished fifth as one unified answer candidate, `6` semitones shares the fifth-class bucket in v1 instead of introducing a separate multiplier.

| Absolute `targetIntervalSemitones` | Interval bucket | Multiplier |
| --- | --- | --- |
| `0` | unison | `1.000` |
| `1..2` | second | `1.050` |
| `3..4` | third | `1.100` |
| `5` | fourth | `1.180` |
| `6..7` | tritone / fifth | `1.260` |
| `8..9` | sixth | `1.360` |
| `10..11` | seventh | `1.480` |
| `12` | octave | `1.600` |

## Session Summary Formulas

Only answered questions are aggregated.
Timed-out unanswered questions are discarded before scoring and are not included in summary values.

```txt
sessionScore =
  round3(sum(questionScore))

avgScorePerQuestion =
  round3(sessionScore / answeredQuestionCount)

accuracyRate =
  round3(correctQuestionCount / answeredQuestionCount)

avgErrorAbs =
  round3(sum(abs(errorSemitones)) / answeredQuestionCount)

avgResponseTimeMs =
  round3(sum(responseTimeMs) / answeredQuestionCount)
```

If `answeredQuestionCount = 0`, all average-style summary values are `0`.

## Rounding Rules

- All internal calculations use decimal numbers.
- `round3(value)` means rounding to three fractional digits.
- DB persistence keeps score values to three fractional digits.
- UI display may round score values for presentation only.
- Do not round intermediate multipliers before the final `round3(...)` step.

## Persistence Rules

- Persist per-question `score` to `question_results.score`.
- Persist session-level `sessionScore` to `training_sessions.session_score`.
- Persist `avgScorePerQuestion`, `accuracyRate`, `avgErrorAbs`, and `avgResponseTimeMs` to their explicit session summary columns.
- Persist `score_formula_version = "v1"` on both `training_sessions` and `question_results`.
- Replay counts are saved for analysis, but they do not affect the v1 formula.

## Intentionally Out Of Scope

- replay-based penalties or bonuses
- adaptive score scaling by user history
- mode-specific alternate formulas
- recalculating old rows into a new formula version
