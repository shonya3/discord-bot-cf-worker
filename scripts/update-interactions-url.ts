import dotenv from "dotenv";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

dotenv.config({ path: ".env" });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is required in .env");
}

const API_BASE = "https://discord.com/api/v10";

export async function updateInteractionsUrl(url: string) {
  const res = await fetch(`${API_BASE}/applications/@me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${DISCORD_TOKEN}`,
    },
    body: JSON.stringify({ interactions_endpoint_url: url }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update interactions URL: ${res.status} ${res.statusText}\n${text}`);
  }

  const data = (await res.json()) as { id: string; interactions_endpoint_url: string | null };
  console.log(`Updated interactions endpoint URL for application ${data.id}`);
  console.log(`New URL: ${data.interactions_endpoint_url}`);
}

async function main() {
  let url = process.argv[2];

  if (!url) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    url = await rl.question("Enter the interactions endpoint URL (or empty to clear): ");
    rl.close();
  }

  console.log("Updating interactions endpoint URL...");
  await updateInteractionsUrl(url || "");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
