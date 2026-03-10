# Training Flow

## Canonical State Order

`config -> preparing -> playing -> answering -> feedback -> result`

## State Details

### `config`

- The user sets or confirms `TrainingConfig`.
- `endCondition.type = time_limit` means a session-wide timer, not a per-question timer.
- No session data is persisted here.

### `preparing`

- Initialize in-memory session state.
- Generate the next `Question`.
- Move immediately to `playing` once the next question is ready.

### `playing`

- Play the reference tone and target tone on the client.
- User answer input is inactive during playback.
- The answer timer does not start yet.

### `answering`

- Start measuring answer time only after question playback ends.
- Manual replay is always allowed in the MVP.
- Replay count is unlimited in the MVP.
- Replay duration is included in `responseTimeMs`.
- No DB access is allowed in this state.

### `feedback`

- Enter after a valid answer is submitted.
- Show the answer outcome for the current question.
- Append one `QuestionResult` to in-memory session results.

Session time-limit handling:

- If the session-wide time limit is reached while the current question is unanswered, discard that unanswered question.
- Do not create a `QuestionResult` for that timed-out question.
- Show only a small timeout note in the UI.
- Move to `result` and finish the session.

### `result`

- Show session summary derived from in-memory results.
- For authenticated users, start one batch save automatically on entering this state.
- For guest users, do not save and keep the result local to the current session only.
- If authenticated save fails, keep the result screen visible and expose a retry action.
- UI score display may round values to integers, but underlying values remain decimal.

## Timer Rules

- `responseTimeMs` starts at the end of playback.
- `responseTimeMs` stops when the user submits an answer.
- Manual replay time counts toward `responseTimeMs`.
- `endCondition.timeLimitMinutes` applies to the whole session.
- Timed-out unanswered questions are excluded from persisted results and score totals.

## Persistence Rules

- Keep per-question data only in memory until the session ends.
- For authenticated users, save one session payload containing config, timestamps, and answered results when `result` is entered.
- For guest users, do not send a save request and do not backfill later after login.
- Do not perform incremental per-question saves in the MVP.
