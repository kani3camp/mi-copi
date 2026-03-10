# AGENTS.md

## Purpose

- Treat `docs/` as the source of truth for product, architecture, implementation, and delivery decisions.
- Keep changes small, scoped, and directly tied to the active task.
- Do not broaden the specification beyond what is already documented.

## Working Rules

- One task should target one responsibility and map cleanly to one PR.
- Do not perform unnecessary refactors.
- Match the existing code style and file conventions of the repository.
- If non-`docs/` markdown or text files conflict with `docs/`, do not resolve the conflict unilaterally. Record the difference and ask for human review.
- Do not delete or rename existing files unless explicitly requested.

## Design Guardrails

- Do not couple UI directly to persistence concerns. Keep UI, logic, and save/load boundaries separable.
- Prefer Server Actions / Server Functions for internal reads and writes.
- Do not access the DB while the user is answering questions.
- Persist training data only when the session ends.
- When logic changes, check whether tests should be added or updated.

## Human Review Required

- DB schema changes that need confirmation
- Migration creation or modification
- Authentication or authorization changes
- New environment variables
- New dependencies
- Security-sensitive or cost-sensitive changes
- Specification changes
- Large file moves or deletions

## Expected Output After Work

- List changed files
- Summarize what each file changed
- Summarize carried-over content from existing docs
- List unresolved points and TODOs
- Suggest the next smallest task
