# DESIGN Bundle 8: Login Alignment / Final Visual QA

## Summary

- Goal: `/login` を bundle 1-7 の visual family に揃え、`DESIGN.md` 反映後の route QA を行う。
- Human approval needed: none.

## Scope

- Refresh `/login` as a clear Google login or guest-start decision screen.
- Keep Better Auth, OAuth, env, route, and auth behavior unchanged.
- Split route-local presentational login panels from the auth-calling client container.
- Add Storybook coverage for login idle, pending, error, and signed-in states.

## Out of Scope

- OAuth provider configuration changes.
- New dependencies.
- Auth callbacks, Better Auth schema, DB schema, or persistence changes.
- Large legacy CSS cleanup outside the login path.

## Verification

- `npm run verify`
- `npm run build-storybook`
- `npm run test:storybook` when Playwright Chromium can launch in the environment.
- Smoke `/login` plus existing key routes at mobile widths where browser automation is available.
