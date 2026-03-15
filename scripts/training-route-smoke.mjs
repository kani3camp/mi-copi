import { webcrypto } from "node:crypto";
import fs from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, devices, webkit } from "playwright";
import postgres from "postgres";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const MOBILE_DEVICE = devices["iPhone 13"];
const DEBUG = process.env.SMOKE_DEBUG === "1";
const BROWSERS = [
  { key: "chromium", label: "Chrome mobile emulation", launcher: chromium },
  { key: "webkit", label: "WebKit mobile emulation", launcher: webkit },
];

async function main() {
  loadDotEnvLocal();

  const authUser = await findSmokeUserWithStoredConfig();
  const report = {
    baseUrl: BASE_URL,
    authUser: authUser
      ? {
          email: authUser.email,
          keyboardNoteLabelsVisible: authUser.keyboardNoteLabelsVisible,
        }
      : null,
    runs: [],
  };

  for (const browserConfig of BROWSERS) {
    report.runs.push(await runGuestSmoke(browserConfig));

    if (authUser) {
      report.runs.push(await runAuthSmoke(browserConfig, authUser));
    }
  }

  const failures = collectFailures(report.runs);

  console.log(JSON.stringify(report, null, 2));

  if (failures.length > 0) {
    console.error("\nSmoke regressions:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }
}

async function runGuestSmoke(browserConfig) {
  debug(`start guest smoke: ${browserConfig.key}`);
  const browser = await browserConfig.launcher.launch({ headless: true });

  try {
    const context = await browser.newContext({
      ...MOBILE_DEVICE,
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
    });

    const distance = await runDistanceGuestScenario(context, browserConfig);
    const keyboard = await runKeyboardGuestScenario(context, browserConfig);

    await context.close();

    return {
      browser: browserConfig.key,
      browserLabel: browserConfig.label,
      auth: "guest",
      scenarios: [distance, keyboard],
    };
  } finally {
    debug(`finish guest smoke: ${browserConfig.key}`);
    await browser.close();
  }
}

async function runAuthSmoke(browserConfig, authUser) {
  debug(`start auth smoke: ${browserConfig.key}`);
  const browser = await browserConfig.launcher.launch({ headless: true });

  try {
    const context = await browser.newContext({
      ...MOBILE_DEVICE,
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
    });
    await context.addCookies([
      {
        domain: "localhost",
        httpOnly: true,
        name: "better-auth.session_token",
        path: "/",
        sameSite: "Lax",
        secure: false,
        value: await signCookieValue(
          authUser.sessionToken,
          process.env.BETTER_AUTH_SECRET,
        ),
      },
    ]);

    const distanceBootstrap = await runDistanceAuthBootstrapScenario(
      context,
      browserConfig,
      authUser,
    );
    const distanceSave = await runDistanceAuthSaveScenario(
      context,
      browserConfig,
      authUser,
    );
    const keyboardImmediate = await runKeyboardAuthScenario(
      context,
      browserConfig,
      authUser,
      {
        mode: "immediate",
        saveFailureOnce: browserConfig.key === "chromium",
        warmupDelayMs: 0,
      },
    );
    const keyboardDelayed = await runKeyboardAuthScenario(
      context,
      browserConfig,
      authUser,
      {
        mode: "delayed",
        saveFailureOnce: false,
        warmupDelayMs: 2000,
      },
    );

    await context.close();

    return {
      browser: browserConfig.key,
      browserLabel: browserConfig.label,
      auth: "authenticated",
      userEmail: authUser.email,
      scenarios: [
        distanceBootstrap,
        distanceSave,
        keyboardImmediate,
        keyboardDelayed,
      ],
    };
  } finally {
    debug(`finish auth smoke: ${browserConfig.key}`);
    await browser.close();
  }
}

async function runDistanceGuestScenario(context, browserConfig) {
  debug(`scenario start: ${browserConfig.key} guest-distance`);
  const page = await context.newPage();
  const scenario = startScenario(browserConfig, "guest-distance");

  try {
    await page.goto(`${BASE_URL}/train/distance`);
    await page.waitForLoadState("networkidle");
    await expectVisible(
      page.locator("h2"),
      "出題設定",
      scenario,
      "config title",
    );
    scenario.checks.push(
      assertEqual(
        await headerQuestion(page),
        null,
        "guest config header has no question label",
      ),
    );
    scenario.checks.push(
      assertTextIncludes(
        await headerNotice(page),
        "ゲストでは保存されません。",
        "guest config header notice",
      ),
    );
    scenario.checks.push(
      assertEqual(
        await page.getByText("前回設定を読み込めます。").count(),
        0,
        "guest does not show stored-config auth notice",
      ),
    );

    await startTraining(page);
    await page.waitForSelector('button[aria-label="基準音を再生"]');
    scenario.checks.push(
      assert(
        await playbackButtonsActiveStateFalse(page),
        "distance playback active state removed",
      ),
    );

    await page.waitForFunction(() => {
      const button = document.querySelector(
        'button[aria-label="基準音を再生"]',
      );
      return button && !button.hasAttribute("disabled");
    });

    await clickElement(page.locator(".ui-train-answer-grid button").first());
    await page.waitForSelector("text=フィードバック");
    await page.getByRole("button", { name: "ここで終了" }).click();
    await page.waitForSelector("text=結果");

    scenario.checks.push(
      assertTextIncludes(
        await page.locator(".ui-notice").first().innerText(),
        "ゲスト利用のため、この結果は保存されません。",
        "guest result notice",
      ),
    );
    scenario.checks.push(
      assert(
        await page
          .getByRole("link", { name: "今後の保存用にログイン" })
          .isVisible(),
        "guest result shows login CTA",
      ),
    );
    scenario.checks.push(
      assert(
        await page.getByRole("button", { name: "もう一度始める" }).isVisible(),
        "guest result shows retry button",
      ),
    );
  } catch (error) {
    scenario.failures.push(renderUnexpectedError(error));
  } finally {
    await page.close();
  }

  debug(`scenario finish: ${browserConfig.key} guest-distance`);
  return finishScenario(scenario);
}

async function runKeyboardGuestScenario(context, browserConfig) {
  debug(`scenario start: ${browserConfig.key} guest-keyboard`);
  const page = await context.newPage();
  const scenario = startScenario(browserConfig, "guest-keyboard");

  try {
    await page.goto(`${BASE_URL}/train/keyboard`);
    await page.waitForLoadState("networkidle");
    await expectVisible(
      page.locator("h2"),
      "出題設定",
      scenario,
      "config title",
    );
    scenario.checks.push(
      assertEqual(
        await headerQuestion(page),
        null,
        "guest config header has no question label",
      ),
    );
    scenario.checks.push(
      assertTextIncludes(
        await headerNotice(page),
        "ゲストでは保存されません。",
        "guest config header notice",
      ),
    );

    await startTraining(page);
    await page.waitForSelector('[data-note][data-reference="true"]');

    scenario.checks.push(
      assert(
        await playbackButtonsActiveStateFalse(page),
        "keyboard playback active state removed",
      ),
    );
    scenario.checks.push(
      assert(
        (await page.locator('[data-note][data-reference="true"]').count()) > 0,
        "keyboard question shows reference key marker",
      ),
    );

    await page.waitForFunction(() => {
      const button = document.querySelector(
        'button[aria-label="基準音を再生"]',
      );
      return button && !button.hasAttribute("disabled");
    });

    await clickElement(page.locator("[data-note]").nth(2));
    await page.waitForSelector("text=フィードバック");
    await page.getByRole("button", { name: "ここで終了" }).click();
    await page.waitForSelector("text=結果");

    scenario.checks.push(
      assertTextIncludes(
        await page.locator(".ui-notice").first().innerText(),
        "ゲスト利用のため、この結果は保存されません。",
        "guest result notice",
      ),
    );
    scenario.checks.push(
      assert(
        await page
          .getByRole("link", { name: "今後の保存用にログイン" })
          .isVisible(),
        "guest result shows login CTA",
      ),
    );
  } catch (error) {
    scenario.failures.push(renderUnexpectedError(error));
  } finally {
    await page.close();
  }

  debug(`scenario finish: ${browserConfig.key} guest-keyboard`);
  return finishScenario(scenario);
}

async function runDistanceAuthBootstrapScenario(
  context,
  browserConfig,
  authUser,
) {
  debug(`scenario start: ${browserConfig.key} auth-distance-bootstrap`);
  const page = await context.newPage();
  const scenario = startScenario(browserConfig, "auth-distance-bootstrap");
  const configSummary = describeDistanceConfig(authUser.lastDistanceConfig);
  let delayedBootstrapSeen = false;
  let storedConfigNoticeSeen = false;

  try {
    await page.route("**/train/distance", async (route) => {
      const request = route.request();
      if (
        !delayedBootstrapSeen &&
        request.method() === "POST" &&
        request.headers()["next-action"]
      ) {
        delayedBootstrapSeen = true;
        await delay(3000);
      }
      await route.continue();
    });

    await page.goto(`${BASE_URL}/train/distance`);
    await page.waitForLoadState("domcontentloaded");
    await expectVisible(
      page.locator("h2"),
      "出題設定",
      scenario,
      "config title",
    );
    scenario.checks.push(
      assertTextIncludes(
        await headerNotice(page),
        "結果画面では自動保存されます。",
        "auth config header notice",
      ),
    );
    scenario.checks.push(
      assertEqual(
        await headerQuestion(page),
        null,
        "auth config header has no question label",
      ),
    );

    const configSelect = page.locator("select").first();
    const editedValue = "time_limit";
    await page.waitForTimeout(300);
    await configSelect.selectOption(editedValue);
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("select")).some(
        (element) => element.value === "180",
      ),
    );

    await page.waitForLoadState("networkidle");
    await delay(300);

    const notices = await page.locator(".ui-notice").allInnerTexts();
    storedConfigNoticeSeen = notices.some((text) =>
      text.includes("前回設定を読み込み"),
    );

    scenario.checks.push(
      assert(
        delayedBootstrapSeen,
        "bootstrap server action was delayed for edit race check",
      ),
    );
    scenario.checks.push(
      assert(
        notices.some(
          (text) =>
            text.includes("保存済み設定を確認しています") ||
            text.includes("前回設定を読み込み済みです。") ||
            text.includes("前回設定を読み込めます。"),
        ),
        "distance bootstrap notice appears",
      ),
    );
    scenario.checks.push(
      assertEqual(
        await configSelect.inputValue(),
        editedValue,
        "manual config edit survives deferred bootstrap",
      ),
    );

    const answerChoiceText = await page
      .locator(".ui-form-chip-list")
      .innerText();
    scenario.observations.configSummary = configSummary;
    scenario.observations.bootstrapNotices = notices;
    scenario.checks.push(
      assert(
        answerChoiceText.includes("増4") || answerChoiceText.includes("完全"),
        "distance config answer choices render",
      ),
    );
  } catch (error) {
    scenario.failures.push(renderUnexpectedError(error));
  } finally {
    await page.unroute("**/train/distance");
    await page.close();
  }

  scenario.observations.bootstrapStoredConfigNoticeSeen =
    storedConfigNoticeSeen;
  debug(`scenario finish: ${browserConfig.key} auth-distance-bootstrap`);
  return finishScenario(scenario);
}

async function runDistanceAuthSaveScenario(context, browserConfig, authUser) {
  debug(`scenario start: ${browserConfig.key} auth-distance-save`);
  const page = await context.newPage();
  const scenario = startScenario(browserConfig, "auth-distance-save");

  try {
    await page.goto(`${BASE_URL}/train/distance`);
    await page.waitForLoadState("networkidle");

    scenario.observations.configSummary = describeDistanceConfig(
      authUser.lastDistanceConfig,
    );
    scenario.checks.push(
      assert(
        (await page
          .locator(
            `select >> option[value="${String(authUser.lastDistanceConfig.endCondition.type)}"]`,
          )
          .count()) > 0,
        "distance config form renders end-condition select",
      ),
    );

    await page.waitForTimeout(2000);
    await startTraining(page);
    await page.waitForSelector('button[aria-label="基準音を再生"]');
    scenario.checks.push(
      assertTextIncludes(
        await headerQuestion(page),
        "1 /",
        "distance active question label",
      ),
    );
    scenario.checks.push(
      assert(
        await playbackButtonsActiveStateFalse(page),
        "distance playback active state remains false",
      ),
    );
    scenario.checks.push(
      assert(
        await page.getByRole("button", { name: "基準音を再生" }).isDisabled(),
        "distance replay is locked during autoplay",
      ),
    );

    await page.waitForFunction(() => {
      const button = document.querySelector(
        'button[aria-label="基準音を再生"]',
      );
      return button && !button.hasAttribute("disabled");
    });

    await clickElement(page.locator(".ui-train-answer-grid button").first());
    await page.waitForSelector("text=フィードバック");
    scenario.checks.push(
      assert(
        await page.getByRole("button", { name: "正解の音を再生" }).isVisible(),
        "distance feedback replay button visible",
      ),
    );
    await clickElement(page.getByRole("button", { name: "ここで終了" }));
    await page.waitForSelector("text=結果");
    scenario.checks.push(
      assertEqual(
        await headerQuestion(page),
        "結果",
        "distance result header label",
      ),
    );

    const saveNoticeTexts = await observeNoticeTexts(page, 3000);
    scenario.observations.saveNoticeTexts = saveNoticeTexts;
    scenario.checks.push(
      assert(
        saveNoticeTexts.some(
          (text) =>
            text.includes("保存の準備をしています") ||
            text.includes("結果を自動保存しています"),
        ),
        "distance result shows pending save notice",
      ),
    );
    scenario.checks.push(
      assert(
        saveNoticeTexts.some((text) =>
          text.includes("結果を自動保存しました。"),
        ),
        "distance result reaches save success notice",
      ),
    );
    scenario.checks.push(
      assertEqual(
        await headerMeta(page),
        "保存済み",
        "distance result header meta",
      ),
    );
  } catch (error) {
    scenario.failures.push(renderUnexpectedError(error));
  } finally {
    await page.close();
  }

  debug(`scenario finish: ${browserConfig.key} auth-distance-save`);
  return finishScenario(scenario);
}

async function runKeyboardAuthScenario(
  context,
  browserConfig,
  authUser,
  options,
) {
  debug(`scenario start: ${browserConfig.key} auth-keyboard-${options.mode}`);
  const page = await context.newPage();
  const scenario = startScenario(
    browserConfig,
    `auth-keyboard-${options.mode}`,
  );
  let saveFailureInjected = false;
  let failNextActionRequest = false;

  try {
    if (options.saveFailureOnce) {
      await page.route("**/train/keyboard", async (route) => {
        const request = route.request();
        const headers = request.headers();
        if (
          failNextActionRequest &&
          request.method() === "POST" &&
          headers["next-action"]
        ) {
          saveFailureInjected = true;
          failNextActionRequest = false;
          await route.abort("failed");
          return;
        }

        await route.continue();
      });
    }

    await page.goto(`${BASE_URL}/train/keyboard`);
    await page.waitForLoadState("networkidle");
    scenario.observations.configSummary = describeKeyboardConfig(
      authUser.lastKeyboardConfig,
    );

    if (options.warmupDelayMs > 0) {
      await page.waitForTimeout(options.warmupDelayMs);
    }

    scenario.checks.push(
      assertTextIncludes(
        await headerNotice(page),
        "結果画面では自動保存されます。",
        "auth config header notice",
      ),
    );

    await startTraining(page);

    const timeline = await captureKeyboardTimeline(page, 1600);
    scenario.observations.timeline = timeline;

    scenario.checks.push(
      assert(
        timeline.some((sample) => sample.title === "準備中"),
        "keyboard shows preparing phase",
      ),
    );
    scenario.checks.push(
      assert(
        timeline.some((sample) => sample.chip === "回答中"),
        "keyboard reaches answering phase",
      ),
    );
    scenario.checks.push(
      assert(
        !timeline.some((sample) =>
          sample.error?.includes("トレーニングの準備中です"),
        ),
        "keyboard start does not hit runtime-not-ready error",
      ),
    );

    await page.waitForSelector('[data-note][data-reference="true"]');
    scenario.checks.push(
      assert(
        await playbackButtonsActiveStateFalse(page),
        "keyboard playback active state remains false",
      ),
    );
    scenario.observations.sawLockedPlaybackPhase = timeline.some(
      (sample) => sample.chip === "再生中" || sample.baseDisabled === true,
    );
    scenario.checks.push(
      assert(
        (await page.locator('[data-note][data-reference="true"]').count()) > 0,
        "keyboard answering shows reference marker",
      ),
    );

    const referenceKeyText = await page
      .locator('[data-note][data-reference="true"]')
      .first()
      .innerText();
    scenario.observations.referenceKeyText = referenceKeyText;
    if (authUser.keyboardNoteLabelsVisible === false) {
      scenario.checks.push(
        assertEqual(
          referenceKeyText.trim(),
          "",
          "keyboard hidden-label mode keeps marker without label text",
        ),
      );
    }

    await clickElement(page.locator("[data-note]").nth(2));
    await page.waitForSelector("text=フィードバック");
    failNextActionRequest = options.saveFailureOnce;
    await clickElement(page.getByRole("button", { name: "ここで終了" }));
    await page.waitForSelector("text=結果");
    scenario.checks.push(
      assertEqual(
        await headerQuestion(page),
        "結果",
        "keyboard result header label",
      ),
    );

    const saveNoticeTexts = await observeNoticeTexts(page, 3000);
    scenario.observations.saveNoticeTexts = saveNoticeTexts;

    if (options.saveFailureOnce) {
      scenario.checks.push(
        assert(saveFailureInjected, "keyboard save failure was injected once"),
      );
      scenario.checks.push(
        assert(
          saveNoticeTexts.some((text) =>
            text.includes("結果を保存できませんでした"),
          ),
          "keyboard result shows save failure notice",
        ),
      );
      const retryButton = page.locator(".ui-action-row button").first();
      await retryButton.waitFor({ state: "visible" });
      await page.waitForFunction(
        () => {
          const button = document.querySelector(".ui-action-row button");
          return button && !button.hasAttribute("disabled");
        },
        { timeout: 10000 },
      );
      await page.unroute("**/train/keyboard");
      await clickElement(retryButton);
      const retriedNotices = await observeNoticeTexts(page, 3000);
      scenario.observations.retryNoticeTexts = retriedNotices;
      scenario.checks.push(
        assert(
          retriedNotices.some((text) =>
            text.includes("結果を自動保存しました。"),
          ),
          "keyboard retry reaches save success",
        ),
      );
      scenario.checks.push(
        assertEqual(
          await headerMeta(page),
          "保存済み",
          "keyboard result header meta after retry",
        ),
      );
    } else {
      scenario.checks.push(
        assert(
          saveNoticeTexts.some(
            (text) =>
              text.includes("保存の準備をしています") ||
              text.includes("結果を自動保存しています"),
          ),
          "keyboard result shows pending save notice",
        ),
      );
      scenario.checks.push(
        assert(
          saveNoticeTexts.some((text) =>
            text.includes("結果を自動保存しました。"),
          ),
          "keyboard result reaches save success notice",
        ),
      );
      scenario.checks.push(
        assertEqual(
          await headerMeta(page),
          "保存済み",
          "keyboard result header meta",
        ),
      );
    }
  } catch (error) {
    scenario.failures.push(renderUnexpectedError(error));
  } finally {
    await page.close();
  }

  debug(`scenario finish: ${browserConfig.key} auth-keyboard-${options.mode}`);
  return finishScenario(scenario);
}

async function captureKeyboardTimeline(page, durationMs) {
  const samples = [];
  const startedAt = Date.now();

  while (Date.now() - startedAt < durationMs) {
    const sample = await page.evaluate(() => {
      const noticeTexts = Array.from(
        document.querySelectorAll(".ui-notice"),
      ).map((element) => element.textContent?.trim() ?? "");

      return {
        t: Date.now(),
        title:
          document.querySelector(".ui-section-title")?.textContent?.trim() ??
          null,
        chip:
          document
            .querySelector(".ui-section-header .ui-chip")
            ?.textContent?.trim() ?? null,
        baseDisabled:
          document
            .querySelector('button[aria-label="基準音を再生"]')
            ?.hasAttribute("disabled") ?? null,
        error:
          noticeTexts.find((text) =>
            text.includes("トレーニングの準備中です"),
          ) ?? null,
      };
    });
    samples.push(sample);
    await page.waitForTimeout(80);
  }

  return samples;
}

async function observeNoticeTexts(page, timeoutMs) {
  const seen = new Set();
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const texts = await page.locator(".ui-notice").allInnerTexts();
    for (const text of texts) {
      if (text.trim()) {
        seen.add(text.trim());
      }
    }
    await page.waitForTimeout(100);
  }

  return [...seen];
}

async function startTraining(page) {
  const button = page.getByRole("button", { name: "開始" });
  await button.waitFor({ state: "visible" });
  await clickElement(button);
}

async function clickElement(locator) {
  await locator.evaluate((element) => {
    element.click();
  });
}

async function playbackButtonsActiveStateFalse(page) {
  const states = await page
    .locator(".ui-playback-button__state")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-active")),
    );

  return states.length > 0 && states.every((value) => value === "false");
}

async function headerQuestion(page) {
  return readOptionalText(
    page.locator(".ui-training-progress-header__question"),
  );
}

async function headerMeta(page) {
  return readOptionalText(page.locator(".ui-training-progress-header__meta"));
}

async function headerNotice(page) {
  return readOptionalText(page.locator(".ui-training-progress-header__notice"));
}

async function readOptionalText(locator) {
  if ((await locator.count()) === 0) {
    return null;
  }

  return (await locator.first().innerText()).trim();
}

async function expectVisible(locator, expectedText, scenario, label) {
  const text = (await locator.first().innerText()).trim();
  scenario.checks.push(assertEqual(text, expectedText, label));
}

function describeDistanceConfig(config) {
  return {
    endCondition: config.endCondition,
    fixedBaseNote: config.fixedBaseNote,
    directionMode: config.directionMode,
    intervalRange: config.intervalRange,
    includeUnison: config.includeUnison,
    includeOctave: config.includeOctave,
    intervalGranularity: config.intervalGranularity,
  };
}

function describeKeyboardConfig(config) {
  return {
    endCondition: config.endCondition,
    fixedBaseNote: config.fixedBaseNote,
    directionMode: config.directionMode,
    intervalRange: config.intervalRange,
    includeUnison: config.includeUnison,
    includeOctave: config.includeOctave,
  };
}

async function findSmokeUserWithStoredConfig() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    const [user] = await sql`
      select u.email,
             us.keyboard_note_labels_visible,
             us.last_distance_config,
             us.last_keyboard_config,
             s.token as session_token
      from "user" u
      join user_settings us on us.user_id = u.id
      join lateral (
        select token
        from session s
        where s.user_id = u.id and s.expires_at > now()
        order by s.created_at desc
        limit 1
      ) s on true
      where us.last_distance_config is not null
        and us.last_keyboard_config is not null
      order by us.keyboard_note_labels_visible asc, us.updated_at desc
      limit 1
    `;

    if (!user) {
      return null;
    }

    return {
      email: user.email,
      keyboardNoteLabelsVisible: user.keyboard_note_labels_visible,
      lastDistanceConfig: user.last_distance_config,
      lastKeyboardConfig: user.last_keyboard_config,
      sessionToken: user.session_token,
    };
  } finally {
    await sql.end();
  }
}

function loadDotEnvLocal() {
  if (!fs.existsSync(".env.local")) {
    return;
  }

  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function startScenario(browserConfig, name) {
  return {
    browser: browserConfig.key,
    name,
    checks: [],
    failures: [],
    observations: {},
  };
}

function finishScenario(scenario) {
  for (const check of scenario.checks) {
    if (!check.ok) {
      scenario.failures.push(check.message);
    }
  }

  return {
    browser: scenario.browser,
    name: scenario.name,
    ok: scenario.failures.length === 0,
    failures: scenario.failures,
    observations: scenario.observations,
  };
}

function collectFailures(runs) {
  const failures = [];

  for (const run of runs) {
    for (const scenario of run.scenarios) {
      if (!scenario.ok) {
        for (const failure of scenario.failures) {
          failures.push(
            `${run.browser}/${run.auth}/${scenario.name}: ${failure}`,
          );
        }
      }
    }
  }

  return failures;
}

function assert(condition, message) {
  return {
    ok: Boolean(condition),
    message,
  };
}

function assertEqual(actual, expected, label) {
  return {
    ok: actual === expected,
    message: `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  };
}

function assertTextIncludes(actual, expectedSubstring, label) {
  return {
    ok: typeof actual === "string" && actual.includes(expectedSubstring),
    message: `${label}: expected ${JSON.stringify(actual)} to include ${JSON.stringify(expectedSubstring)}`,
  };
}

function renderUnexpectedError(error) {
  return error instanceof Error ? error.message : String(error);
}

function debug(message) {
  if (DEBUG) {
    console.error(`[smoke] ${message}`);
  }
}

async function signCookieValue(value, secret) {
  const signature = await makeCookieSignature(value, secret);
  return encodeURIComponent(`${value}.${signature}`);
}

async function makeCookieSignature(value, secret) {
  const cryptoKey = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      hash: "SHA-256",
      name: "HMAC",
    },
    false,
    ["sign"],
  );
  const signature = await webcrypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(value),
  );

  return Buffer.from(signature).toString("base64");
}

await main();
