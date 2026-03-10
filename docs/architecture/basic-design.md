# Basic Design

## Screen Structure

- `/`
  - Home dashboard with current user summary and quick access to training, settings, and stats
- `/train`
  - Training screen implemented as one route with internal UI state switching
- `/stats`
  - Independent route for aggregated trends and summary metrics
- `/settings`
  - Independent route for user training preferences and defaults

## Train Route State Machine

The train route uses the following internal states:

1. `config`
2. `preparing`
3. `playing`
4. `answering`
5. `feedback`
6. `result`

## State Responsibilities

- `config`
  - Edit or confirm `TrainingConfig`
- `preparing`
  - Build in-memory session state and the next question payload
- `playing`
  - Play the reference tone and target tone on the client
- `answering`
  - Accept user input after playback ends
- `feedback`
  - Show pitch error, response time, and score for the answered question
- `result`
  - Show session summary and trigger one-time authenticated persistence on result entry

## Routing And Responsibility Split

- Client-heavy responsibilities
  - Audio generation and playback
  - Train route state machine
  - Per-question timer handling
  - Temporary in-memory accumulation of question results
- Server-first responsibilities
  - Authentication and current-user lookup
  - User settings read/write
  - Home summary read
  - Stats read with on-demand aggregation
  - Session save at the end of training

## Session Persistence Policy

- Do not access the DB during `playing`, `answering`, or `feedback`.
- Keep session data in client state until the session reaches `result`.
- For authenticated users, persist the session in one batch on entering `result` via Server Action / Server Function.
- Guest sessions remain local-only and are never persisted.
- If the authenticated save fails, keep the result screen visible and expose a retry action.

## Statistics Policy

- MVP statistics are aggregated on read from persisted session data.
- Do not introduce precomputed summary tables in the MVP.
- Trend views read from `training_sessions` and `question_results`.
