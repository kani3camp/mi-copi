# Scoring

## Score Version

- `score_formula_version = "v1"`

## Canonical Formula Shape

For each answered question:

```txt
question_score =
  round3(
    100
    * accuracy_multiplier
    * speed_multiplier
    * distance_multiplier
  )
```

Where:

- `accuracy_multiplier`: reflects pitch accuracy
- `speed_multiplier`: reflects answer speed
- `distance_multiplier`: reflects target interval distance

## Multiplier Tables

### `accuracy_multiplier`

Absolute `pitch_error_cents` is mapped as follows:

| Condition | Multiplier |
| --- | --- |
| `<= 5` | `1.000` |
| `<= 10` | `0.950` |
| `<= 20` | `0.850` |
| `<= 35` | `0.700` |
| `<= 50` | `0.500` |
| `> 50` | `0.250` |

### `speed_multiplier`

`response_time_ms` measured from playback end, including manual replay time, is mapped as follows:

| Condition | Multiplier |
| --- | --- |
| `<= 1_000` | `1.000` |
| `<= 2_000` | `0.950` |
| `<= 3_500` | `0.850` |
| `<= 5_000` | `0.700` |
| `<= 8_000` | `0.500` |
| `> 8_000` | `0.250` |

### `distance_multiplier`

Absolute `distance_semitones` is mapped as follows:

| Condition | Multiplier |
| --- | --- |
| `<= 2` | `1.000` |
| `<= 5` | `1.050` |
| `<= 8` | `1.100` |
| `>= 9` | `1.150` |

## Calculation Rules

- All multipliers are decimal values.
- `question_score = round3(100 * accuracy_multiplier * speed_multiplier * distance_multiplier)`.
- Persist multiplier outputs and final score semantics with up to three fractional digits.
- Final stored `score` is rounded to the third decimal place.
- UI may round the final score to an integer for display only.
- Internal calculations and DB persistence both keep decimal scores to three fractional digits.

## Session-Level Values

- `total_score` is the sum of saved per-question scores.
- `average_score` is the arithmetic mean of saved per-question scores.
- Timed-out unanswered questions do not contribute a score.

## Storage Rules

- Persist per-question `score` as `numeric(..., 3)`.
- Persist `score_formula_version = "v1"` on both `training_sessions` and `question_results`.
