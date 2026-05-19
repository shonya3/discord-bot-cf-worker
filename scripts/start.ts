import { spawn } from "node:child_process";
import process from "node:process";
import dotenv from "dotenv";
import { updateInteractionsUrl } from "./update-interactions-url.js";

dotenv.config({ path: ".env" });

const tunnelUrlRegex = /Sharing via Cloudflare Tunnel: (https:\/\/[^\s/]+\/?)/;
let urlUpdated = false;

function stripAnsi(text: string): string {
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

async function waitForTunnel(rootUrl: string): Promise<void> {
  for (;;) {
    try {
      const res = await fetch(rootUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function updateWithRetry(url: string, retries = 10, delayMs = 5000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await updateInteractionsUrl(url);
      return;
    } catch {
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(`Failed to update Discord endpoint after ${retries} attempts`);
}

function filterEpipe(chunk: Buffer): boolean {
  const text = chunk.toString();
  return text.includes("write EPIPE") || text.includes("Error: write");
}

const isWin = process.platform === "win32";

const wrangler = isWin
  ? spawn("cmd.exe", ["/c", "pnpm", "wrangler", "dev", "--tunnel"], {
      stdio: ["inherit", "pipe", "pipe"],
    })
  : spawn("script", ["-q", "-c", "pnpm wrangler dev --tunnel", "/dev/null"], {
      stdio: ["inherit", "pipe", "pipe"],
    });

wrangler.stdout.on("data", (chunk: Buffer) => {
  const text = chunk.toString();
  try {
    process.stdout.write(text);
  } catch {
    /* ignore */
  }

  if (!urlUpdated) {
    const clean = stripAnsi(text);
    const match = clean.match(tunnelUrlRegex);
    if (match) {
      urlUpdated = true;
      const tunnelUrl = match[1];
      if (!tunnelUrl) return;
      const url = tunnelUrl.replace(/\/?$/, "/interaction");

      console.log("Waiting for tunnel URL DNS propagation (takes 5-60 sec)...\n");
      waitForTunnel(tunnelUrl)
        .then(() => {
          console.log(`Auto-updating Discord interactions endpoint to ${url}...\n`);
          return updateWithRetry(url);
        })
        .catch((err: unknown) => {
          console.error(
            "Failed to auto-update Discord endpoint:",
            err instanceof Error ? err.message : err,
          );
        });
    }
  }
});

wrangler.stdout.on("error", () => {});

wrangler.stderr.on("data", (chunk: Buffer) => {
  if (filterEpipe(chunk)) return;
  process.stderr.write(chunk.toString());
});

wrangler.stderr.on("error", () => {});

wrangler.on("exit", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => wrangler.kill("SIGINT"));
process.on("SIGTERM", () => wrangler.kill("SIGTERM"));
