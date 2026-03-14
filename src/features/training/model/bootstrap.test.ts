import assert from "node:assert/strict";
import test from "node:test";

const {
  getResolvedTrainingBootstrapConfigDecision,
  shouldApplyDeferredTrainingBootstrap,
  shouldHydrateResolvedTrainingBootstrap,
} = await import(new URL("./bootstrap.ts", import.meta.url).href);

test("shouldApplyDeferredTrainingBootstrap allows applying before the session starts", () => {
  assert.equal(
    shouldApplyDeferredTrainingBootstrap({
      phase: "config",
      startedAt: null,
      hasEditedConfig: false,
    }),
    true,
  );
});

test("shouldApplyDeferredTrainingBootstrap blocks applying after manual edits", () => {
  assert.equal(
    shouldApplyDeferredTrainingBootstrap({
      phase: "config",
      startedAt: null,
      hasEditedConfig: true,
    }),
    false,
  );
});

test("shouldApplyDeferredTrainingBootstrap blocks applying after the session starts", () => {
  assert.equal(
    shouldApplyDeferredTrainingBootstrap({
      phase: "playing",
      startedAt: "2026-03-13T00:00:00.000Z",
      hasEditedConfig: false,
    }),
    false,
  );
});

test("shouldHydrateResolvedTrainingBootstrap runs once per resolved payload", () => {
  assert.equal(
    shouldHydrateResolvedTrainingBootstrap({
      hasResolvedBootstrap: true,
      hasHydratedSettings: false,
    }),
    true,
  );
  assert.equal(
    shouldHydrateResolvedTrainingBootstrap({
      hasResolvedBootstrap: true,
      hasHydratedSettings: true,
    }),
    false,
  );
});

test("getResolvedTrainingBootstrapConfigDecision applies stored config once before edits", () => {
  assert.equal(
    getResolvedTrainingBootstrapConfigDecision({
      hasResolvedBootstrap: true,
      hasStoredConfig: true,
      hasHandledStoredConfig: false,
      phase: "config",
      startedAt: null,
      hasEditedConfig: false,
    }),
    "apply",
  );
  assert.equal(
    getResolvedTrainingBootstrapConfigDecision({
      hasResolvedBootstrap: true,
      hasStoredConfig: true,
      hasHandledStoredConfig: true,
      phase: "config",
      startedAt: null,
      hasEditedConfig: false,
    }),
    "none",
  );
});

test("getResolvedTrainingBootstrapConfigDecision skips stored config after manual edits", () => {
  assert.equal(
    getResolvedTrainingBootstrapConfigDecision({
      hasResolvedBootstrap: true,
      hasStoredConfig: true,
      hasHandledStoredConfig: false,
      phase: "config",
      startedAt: null,
      hasEditedConfig: true,
    }),
    "skip",
  );
});

test("getResolvedTrainingBootstrapConfigDecision skips stored config after session start", () => {
  assert.equal(
    getResolvedTrainingBootstrapConfigDecision({
      hasResolvedBootstrap: true,
      hasStoredConfig: true,
      hasHandledStoredConfig: false,
      phase: "answering",
      startedAt: "2026-03-14T09:30:00.000Z",
      hasEditedConfig: false,
    }),
    "skip",
  );
});
