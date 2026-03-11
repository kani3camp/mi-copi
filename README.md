# mi-copi

## Source Of Truth

- Task scope: `docs/tasks/active-task.md`
- Product constraints and decisions: `docs/product/*.md`
- Execution policy: `AGENTS.md`

## Verification

- `npm run format`
  - Applies Biome auto-fixable checks to the tracked repo sources
- `npm run typecheck`
- `npm run lint`
  - Runs the Biome linter
- `npm run lint:repo`
  - Runs repo-specific static checks for committed source (`console.log`, `debugger`, lint suppression comments)
- `npm run check`
  - Runs Biome formatter/linter checks without writing files
- `npm run test`
  - Node built-in `node:test` unit tests for pure training model logic
- `npm run verify`
  - Runs `typecheck`, `check`, `lint:repo`, `test`, and `build`
