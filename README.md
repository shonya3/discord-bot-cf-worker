# Cloudflare Discord Bot

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation)
- [Discord Developer Portal](https://discord.com/developers/applications) access

## Quick Start

### 1. Clone Repository

```
git clone https://github.com/shonya3/discord-bot-cf-worker.git
cd discord-bot-cf-worker
```

### 2. Install Dependencies

```
pnpm install
```

### 3. Configure Environment

1. Copy the example environment file:

```
cp .env.example .env
```

2. Update `.env` with your credentials:

```
DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=
DISCORD_TOKEN=
```

### 4. Authenticate Wrangler

```
npx wrangler login
```

## Development Workflow

Start the local dev server with a public Cloudflare Tunnel (no ngrok needed):

```
pnpm run dev
```

The tunnel URL is automatically detected and the Discord interactions endpoint is updated for you. Discord verifies the endpoint by sending a test ping, then your bot is ready to receive commands.

## Deployment

Deploy to production, including secrets and Discord endpoint update:

```
pnpm run deploy
```

The script will prompt you to:

1. Deploy secrets from `.env` to production via `wrangler secret bulk`
2. Run `wrangler deploy`
3. Auto-detect the production URL and update the Discord interactions endpoint

Alternatively, deploy manually:

```
pnpm wrangler deploy
```

Then update the Discord endpoint to your production URL:

```
pnpm run update-url https://your-bot-name.your-subdomain.workers.dev/interaction
```

## Adding Commands

### 1. Create a New Command

1. Add your command definition in `src/commands.ts`:

```ts
export const commands = {
  // ...existing commands
  your_command: {
    name: "your_command",
    description: "Your command description",
  },
} as const;
```

2. Implement the command handler in your interaction handler

### 2. Register Commands with Discord

After adding new commands, register them with Discord's API:

```
pnpm run commands
```

This runs the command registration script which:

- Pushes your command definitions to Discord
- Updates the command list in all servers where your bot is installed

❗ **Note**:

- Command updates may take up to 1 hour to propagate globally
