import { spawn } from "node:child_process";
import process from "node:process";
import readline from "node:readline/promises";
import dotenv from "dotenv";
import { updateInteractionsUrl } from "./update-interactions-url.js";
import { registerCommands } from "./utils/register-commands.js";

dotenv.config({ path: ".env" });

const deployUrlRegex = /(https:\/\/[^\s]+\.workers\.dev)/;
let deployUrl: string | null = null;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const secretsAnswer = await rl.question("Deploy secrets from .env to production? (y/n): ");
if (["y", "yes"].includes(secretsAnswer.toLowerCase().trim())) {
  console.log("\n> pnpm wrangler secret bulk .env\n");
  await new Promise<void>((resolve) => {
    const child = spawn("pnpm", ["wrangler", "secret", "bulk", ".env"], {
      stdio: "inherit",
    });
    child.on("exit", () => resolve());
  });
}

const answer = await rl.question("\nUpdate Discord interactions endpoint to production URL? (y/n): ");
rl.close();

if (!["y", "yes"].includes(answer.toLowerCase().trim())) {
  console.log("Deploying without updating Discord endpoint...\n");
  spawn("pnpm", ["wrangler", "deploy"], { stdio: "inherit" });
  process.exit(0);
}

console.log("");

const wrangler = spawn("pnpm", ["wrangler", "deploy"], {
  stdio: ["inherit", "pipe", "inherit"],
});

wrangler.stdout.on("data", (chunk: Buffer) => {
  const text = chunk.toString();
  try { process.stdout.write(text); } catch {}

  if (!deployUrl) {
    const clean = text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
    const match = clean.match(deployUrlRegex);
    if (match) {
      deployUrl = match[1] ?? null;
    }
  }
});

wrangler.stdout.on("error", () => {});

async function waitForEndpoint(rootUrl: string): Promise<void> {
  for (;;) {
    try {
      const res = await fetch(rootUrl, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
}

wrangler.on("exit", async (code) => {
  if (code !== 0) process.exit(code ?? 1);

  if (deployUrl) {
    const url = deployUrl.replace(/\/?$/, "/interaction");
    console.log("\nWaiting for deployment to propagate...\n");
    await waitForEndpoint(deployUrl);
    try {
      await updateInteractionsUrl(url);
    } catch (err: unknown) {
      console.error("Failed to update Discord endpoint:", err instanceof Error ? err.message : err);
    }
    console.log("Registering commands...\n");
    await registerCommands();
  } else {
    console.error("\nCould not detect deployment URL from wrangler output.");
    process.exit(1);
  }
});

process.on("SIGINT", () => wrangler.kill("SIGINT"));
process.on("SIGTERM", () => wrangler.kill("SIGTERM"));
