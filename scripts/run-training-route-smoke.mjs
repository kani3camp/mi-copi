import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const DEFAULT_PORT = 3100;
const SERVER_READY_TIMEOUT_MS = 30_000;
const SERVER_READY_POLL_MS = 500;
const SERVER_STOP_TIMEOUT_MS = 5_000;

async function main() {
  const configuredBaseUrl = process.env.SMOKE_BASE_URL;

  if (configuredBaseUrl) {
    await runSmoke(configuredBaseUrl);
    return;
  }

  const port = Number(process.env.SMOKE_PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid SMOKE_PORT: ${process.env.SMOKE_PORT}`);
  }

  const baseUrl = `http://127.0.0.1:${port}`;
  const nextCli = path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  const server = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      env: { ...process.env, PORT: String(port) },
      stdio: "inherit",
    },
  );
  const serverExit = waitForExit(server);

  try {
    await waitForServer(baseUrl, server);
    await runSmoke(baseUrl);
  } finally {
    await stopServer(server, serverExit);
  }
}

async function waitForServer(baseUrl, server) {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(
        `Next.js server exited before smoke tests started (code=${server.exitCode}, signal=${server.signalCode}).`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/train/distance`, {
        redirect: "manual",
        signal: AbortSignal.timeout(2_000),
      });
      if (response.status < 500) {
        return;
      }
    } catch {
      // The server may still be starting. Retry until the deadline.
    }

    await delay(SERVER_READY_POLL_MS);
  }

  throw new Error(`Next.js server did not become ready at ${baseUrl}.`);
}

async function runSmoke(baseUrl) {
  const smoke = spawn(process.execPath, ["scripts/training-route-smoke.mjs"], {
    env: { ...process.env, SMOKE_BASE_URL: baseUrl },
    stdio: "inherit",
  });
  const result = await waitForExit(smoke);

  if (result.code !== 0) {
    throw new Error(
      `Training route smoke tests failed (code=${result.code}, signal=${result.signal}).`,
    );
  }
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function stopServer(server, serverExit) {
  if (server.exitCode !== null || server.signalCode !== null) {
    await serverExit;
    return;
  }

  server.kill("SIGTERM");
  await Promise.race([serverExit, delay(SERVER_STOP_TIMEOUT_MS)]);

  if (server.exitCode === null && server.signalCode === null) {
    server.kill("SIGKILL");
    await serverExit;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
