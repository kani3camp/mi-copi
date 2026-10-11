# mi-copi autonomous design quality improvement

## Goal
Improve the visual quality of the main screens while preserving training, scoring, settings, persistence, authentication and routes. Use the existing logged-in Claude Design project through Chrome for actual proposals and critique.

## Why now
The 2026-10-11 UI/UX audit identifies a blocking stats exception and mobile hierarchy/readability problems. The repository was clean before planning; the dedicated worktree starts at origin/develop 728e943.

## References
DESIGN.md, docs/product/*, docs/delivery/acceptance-criteria.md, mi-copi-ui-ux-audit.zip (2026-10-11), existing React components and v2 tokens. Claude project c63d6c0a-c19c-4983-8edb-335511325910 contains Design System v2 and Redesign v2.

## In scope
1. Phase 0: independently fix F01 Server/Client formatter boundary, verify authenticated stats and switch modes, create PR and merge after CI.
2. Compare multiple Claude Design directions for home, distance answer/feedback, keyboard answer/feedback; visually inspect and critique through two to three iterations.
3. Implement the selected intent using shared React/CSS components. Verify 360/390/430/768/1440px and answer, exact, near, large-error, reference overlap states.
4. Apply the same process to stats, settings, result, saved detail and login. Record selected and rejected directions.
5. Keep one responsibility per PR, run npm run verify and browser checks, merge to develop after passing CI. No main release.

## Out of scope
New dependencies, environment variables, external service configuration, schema/migrations, data deletion, route changes, scoring or persistence semantics, paid plan changes. Never send credentials or private user data to Claude.

## Files likely touched
StatsTrendSwitch/page for F01; DESIGN.md only if visual rules are clarified; shared primitives, v2 CSS, home, training panels/ruler/keyboard, stats, settings, login and saved session detail. Tests/stories only for affected behavior and important visual states.

## Verification
Existing server/domain tests, npm run verify (including Storybook/a11y and route smoke), CI. Actual Browser Use against local app; compare before/after at all five widths; test replay, answer, next, navigation, all feedback roles and hidden labels.

## Human approval needed?
No for the authorized scope. Request only if an AGENTS.md approval boundary is encountered or a login/site permission/file upload requires the user. No Plan mode switching tool is available in this session; this document records the required pre-implementation plan in Default mode.

## Progress
- Prepared dedicated worktree; located audit ZIP and existing logged-in Claude Design v2 project.
- Phase 0 complete: F01 formatter resolved inside the client boundary, authenticated mode-switch/reload regression added, smoke cookie host corrected. Full verify (160 unit tests, 53 Storybook browser/a11y tests, Chromium/WebKit route smoke) and CI passed. PR #11 merged into develop at 37f6040.
- Claude Design: reused the actual logged-in project. Source/token/audit context was submitted as sanitized text. The file-picker path required Chrome extension file URL access, but authorized image clipboard paste succeeded without expanding extension permissions; that user action is no longer needed. Guest distance/keyboard representative screenshots were actually attached. Local Browser login was handed off for authenticated manual inspection; automated authenticated smoke already passes.
- Home Round 1 compared: A instrument console provides equal mode priority; B editorial rows are lighter but circular CTAs weaken the instrument character; C puts history before training for authenticated users and was rejected.
- Home Round 2 compared at 390 guest and 360 authenticated: adopt A's equal two-column entry on one white surface, decorative line drawings without sample numeric data, neutral guest note, training before records. Reject B's large title/rules because they delay entry and wrap supporting copy into three lines.
- Home Round 3 selected after visual review: readable 28px brand/14px functional copy, minimal shadow, pitch-class selection wording, existing ms display contract, distinct latest/average labels, safe link semantics, empty and long-date states. Implemented with existing PendingLink, PageHeader, SectionHeader and v2 tokens, without copying generated HTML.

- Home browser verification: actual guest screen and anonymized saved-screen story checked at exact 360/390/430/768/1440×844 CSS pixels; no horizontal overflow, both start CTAs 48px high and within the first viewport. Distance/keyboard/settings/login links navigated successfully. Empty and long numeric/date values checked at 360px. Latest score and recent averages remain separate; dates use UI type, ms/semitone units are explicit. Initial a11y detected 4.32:1 link contrast on canvas; fixed with the existing Azure text token, four home stories pass.
- Distance Round 1: A offers a compact comparison strip and ruler; B enlarges status/progress excessively; C gives the ruler priority but long interval labels inside it can collide. Requested two Round 2 combinations with readable 0 tick, separate reference label, neutral guest notice, preserved candidate groups and reachable next/replay controls. Existing default is unison off (1–12); 0 only appears when enabled.
- Home final verification: npm run verify passed (160 unit tests, 57 Storybook browser/a11y tests, production build and Chromium/WebKit guest/authenticated route smoke including stats reload). No dependency, environment, route, schema, scoring or persistence changes.
