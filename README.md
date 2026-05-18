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

### 1. Start Local Server with Tunnel

```
pnpm run tunnel
```

This starts the local dev server and creates a public Cloudflare Tunnel (no ngrok needed):

```
⬣ Sharing via Cloudflare Tunnel: https://some-string.trycloudflare.com/
```

### 2. Configure Discord Interactions Endpoint

1. Take your tunnel URL and append `/interactions`:

```
https://some-string.trycloudflare.com/interactions
```

2. Go to your [Discord Application Settings](https://discord.com/developers/applications)
3. In "General Information" → "Interactions Endpoint URL":

- Paste your tunnel URL with `/interactions`
- Click "Save"

❗ **Important**: The tunnel must be running when saving the URL, as Discord will immediately send a verification ping.

## Deployment

1. Deploy to production:

   Using pnpm:

```
pnpm wrangler deploy
```

2. After successful deployment, Wrangler will output your production URL:

```
https://your-bot-name.your-subdomain.workers.dev
```

3. Update Discord Interactions Endpoint:

- Take your production URL and append /interactions:

```
https://your-bot-name.your-subdomain.workers.dev/interactions
```

- Go to your [Discord Application Settings](https://discord.com/developers/applications)
- In "General Information" → "Interactions Endpoint URL":
  - Paste your production URL with /interactions
  - Click "Save"

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
