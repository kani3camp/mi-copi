import assert from "node:assert/strict";
import test from "node:test";

const {
  clampMasterVolume,
  createDefaultGlobalUserSettings,
  normalizeGlobalUserSettings,
  parseGlobalUserSettings,
  serializeGlobalUserSettings,
} = await import(new URL("./global-user-settings.ts", import.meta.url).href);
const {
  formatDirectionModeLabel,
  formatQuestionDirectionLabel,
  formatSignedSemitoneLabel,
  getIntervalLabel,
} = await import(
  new URL("../../training/model/interval-notation.ts", import.meta.url).href
);

test("default global settings use the MVP baseline values", () => {
  assert.deepEqual(createDefaultGlobalUserSettings(), {
    masterVolume: 80,
    soundEffectsEnabled: true,
    intervalNotationStyle: "ja",
    keyboardNoteLabelsVisible: true,
  });
});

test("normalizeGlobalUserSettings clamps and backfills invalid input", () => {
  assert.deepEqual(
    normalizeGlobalUserSettings({
      masterVolume: 120,
      soundEffectsEnabled: false,
      intervalNotationStyle: "invalid",
    }),
    {
      masterVolume: 100,
      soundEffectsEnabled: false,
      intervalNotationStyle: "ja",
      keyboardNoteLabelsVisible: true,
    },
  );
});

test("global settings serialization round-trips through JSON storage", () => {
  const serialized = serializeGlobalUserSettings({
    masterVolume: 33,
    soundEffectsEnabled: false,
    intervalNotationStyle: "mixed",
    keyboardNoteLabelsVisible: false,
  });

  assert.deepEqual(parseGlobalUserSettings(serialized), {
    masterVolume: 33,
    soundEffectsEnabled: false,
    intervalNotationStyle: "mixed",
    keyboardNoteLabelsVisible: false,
  });
  assert.equal(parseGlobalUserSettings("{"), null);
  assert.equal(clampMasterVolume(Number.NaN), 80);
});

test("interval labels switch between Japanese, abbreviation, and mixed styles", () => {
  assert.equal(getIntervalLabel(6, "ja"), "増4度 / 減5度");
  assert.equal(getIntervalLabel(6, "abbr"), "A4 / d5");
  assert.equal(getIntervalLabel(6, "mixed"), "増4度 / 減5度 (A4 / d5)");
});

test("signed semitone labels keep direction explicit", () => {
  assert.equal(formatSignedSemitoneLabel(0), "0半音（ぴったり）");
  assert.equal(formatSignedSemitoneLabel(1), "+1半音（高い）");
  assert.equal(formatSignedSemitoneLabel(-2), "-2半音（低い）");
});

test("direction labels use the user-facing Japanese wording", () => {
  assert.equal(formatQuestionDirectionLabel("up"), "上方向");
  assert.equal(formatQuestionDirectionLabel("down"), "下方向");
  assert.equal(formatDirectionModeLabel("up_only"), "上方向のみ");
  assert.equal(formatDirectionModeLabel("mixed"), "上下");
});
