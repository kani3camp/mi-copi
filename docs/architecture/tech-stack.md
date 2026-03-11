# Tech Stack

## Adopted Stack

| Area | Choice | Reason |
| --- | --- | --- |
| App framework | Next.js App Router + TypeScript | Strong fit for server/client boundary control and typed iterative development |
| Auth | Better Auth + Google OAuth | Matches the fixed sign-in requirement while keeping auth flows standardized |
| ORM | Drizzle ORM | Typed schema/query layer that fits small incremental development |
| DB | PostgreSQL | Stable relational store for users, sessions, and question results |
| Audio | Web Audio API | Client-side sound generation without extra backend dependencies |

## Architectural Direction

- Prefer Server Actions / Server Functions for internal reads and writes.
- Keep playback, timers, and interaction handling on the client.
- Keep persistence, auth, and summary reads on the server.
- Do not query the DB while the user is answering.
- Keep Better Auth tables in a dedicated auth schema module and app tables in a separate app schema module.

## Development Process

- Assume AI-assisted implementation as a first-class workflow.
- Keep PRs small and single-purpose.
- Use types, focused tests, and CI checks to hold quality.
- Prefer pure logic modules before UI integration when a feature can be decomposed that way.

## Quality Strategy

- Type-check all contract and domain changes.
- Add or update tests when logic changes.
- Keep CI centered on lint, typecheck, and test.
- Avoid speculative abstractions until repeated use makes them necessary.
- Default local verification commands are `npm run lint`, `npm run typecheck`, and `npm run test`.

## Open Points

- TODO: confirm the CI provider.
- TODO: confirm whether Better Auth integration will use only server wrappers or a mix of official client helpers where required by the library.
