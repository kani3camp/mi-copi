import { chromium } from "playwright";

const SESSION_TOKEN = process.env.MI_COPI_SESSION_TOKEN ?? null;
const DEV_URL = process.env.MI_COPI_DEV_URL ?? "http://localhost:3000";
const PROD_URL = process.env.MI_COPI_PROD_URL ?? "http://localhost:3100";

const scenarios = [
  {
    name: "home_to_distance",
    href: "/train/distance",
    heading: "距離モード",
  },
  {
    name: "home_to_keyboard",
    href: "/train/keyboard",
    heading: "鍵盤モード",
  },
  {
    name: "home_to_login",
    href: "/login",
    heading: "ログイン",
  },
];

async function measureSuite(baseURL, signedIn) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "x-mi-copi-timing": "1",
    },
  });

  if (signedIn && SESSION_TOKEN) {
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: SESSION_TOKEN,
        domain: "localhost",
        path: "/",
      },
    ]);
  }

  const page = await context.newPage();
  const measurements = [];
  const requests = [];
  const responses = [];

  page.on("request", (request) => {
    requests.push({
      timestamp: Date.now(),
      url: request.url(),
      headers: request.headers(),
    });
  });
  page.on("response", (response) => {
    responses.push({
      timestamp: Date.now(),
      url: response.url(),
    });
  });

  for (const scenario of scenarios) {
    requests.length = 0;
    responses.length = 0;
    await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const clickAt = Date.now();

    await page.locator(`a[href="${scenario.href}"]`).first().click();
    await page.waitForURL(`**${scenario.href}`);
    await page.waitForFunction((expectedHeading) => {
      const heading = document.querySelector("h1");

      return heading?.textContent?.includes(expectedHeading) ?? false;
    }, scenario.heading);

    const headingVisibleAt = Date.now();
    const preClickRequests = requests.filter(
      (request) => request.timestamp < clickAt,
    );
    const firstRscRequest = requests.find(
      (request) =>
        request.timestamp >= clickAt &&
        request.url.includes(`${scenario.href}?_rsc=`) &&
        request.headers.rsc === "1",
    );
    const firstRscResponse = responses.find(
      (response) =>
        response.timestamp >= clickAt &&
        response.url.includes(`${scenario.href}?_rsc=`),
    );
    const prefetchDetected = preClickRequests.some(
      (request) =>
        request.url.includes(scenario.href) &&
        request.headers["next-router-prefetch"] === "1",
    );

    measurements.push({
      scenario: scenario.name,
      prefetchDetected,
      clickToFirstRscRequestMs: firstRscRequest
        ? firstRscRequest.timestamp - clickAt
        : null,
      clickToRscResponseMs: firstRscResponse
        ? firstRscResponse.timestamp - clickAt
        : null,
      clickToHeadingVisibleMs: headingVisibleAt - clickAt,
    });
  }

  await browser.close();

  return measurements;
}

async function main() {
  const suites = {
    dev_guest: await measureSuite(DEV_URL, false),
    prod_guest: await measureSuite(PROD_URL, false),
  };

  if (SESSION_TOKEN) {
    suites.dev_auth = await measureSuite(DEV_URL, true);
    suites.prod_auth = await measureSuite(PROD_URL, true);
  }

  console.log(JSON.stringify(suites, null, 2));
}

await main();
