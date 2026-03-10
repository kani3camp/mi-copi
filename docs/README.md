# Docs Overview

`docs/` is the source of truth for this repository.

## Structure

- `docs/product/requirements.md`
  - Product goals, target users, scope, and non-scope for the MVP.
- `docs/architecture/basic-design.md`
  - Screen structure, routing, state transitions, and client/server responsibilities.
- `docs/architecture/tech-stack.md`
  - Adopted technologies and the development quality strategy.
- `docs/implementation/*.md`
  - Source-of-truth implementation design for schema, TypeScript types, contracts, flow, and scoring.
- `docs/delivery/*.md`
  - PR breakdown and completion criteria.

## How To Use

- If an existing markdown or text file outside `docs/` differs from `docs/`, treat `docs/` as canonical for new work and report the difference explicitly.
- If a point is still undecided, keep it as `TODO` or an unresolved point instead of guessing.
- Do not create migrations, add dependencies, or change auth behavior based only on these docs without human confirmation.
