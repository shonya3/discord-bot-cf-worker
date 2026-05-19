import { commands } from "../../src/commands.js";

export async function registerCommands(): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  const applicationId = process.env.DISCORD_APPLICATION_ID;

  if (!token || !applicationId) {
    console.warn("Cannot register commands: DISCORD_TOKEN or DISCORD_APPLICATION_ID not set");
    return;
  }

  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${token}`,
      },
      method: "PUT",
      body: JSON.stringify(Object.values(commands)),
    });

    if (response.ok) {
      console.log(`Registered commands: ${Object.values(commands).map((c) => c.name).join(", ")}`);
    } else {
      const error = await response.text().catch(() => "unknown error");
      console.warn(`Failed to register commands (${response.status}): ${error}`);
    }
  } catch (err) {
    console.warn("Failed to register commands:", err instanceof Error ? err.message : err);
  }
}
