# mi-copi

## Verification

- `npm run typecheck`
- `npm run lint`
  - Repo-specific static checks for committed source (`console.log`, `debugger`, stale `eslint-disable` comments)
- `npm run test`
  - Node built-in `node:test` unit tests for pure training model logic
- `npm run verify`
  - Runs `typecheck`, `lint`, and `test`
