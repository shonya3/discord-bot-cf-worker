# Cloudflare Discord Bot Starter

## Overview

A serverless Discord bot template built on Cloudflare Workers. Deploy a bot globally on Cloudflare's edge network with minimal setup.

## Features

- ⚡ Serverless architecture (no servers to manage)
- 🌍 Global low-latency via Cloudflare's network
- 🤖 Built-in Discord interaction handling
- 🔒 Environment-based configuration
- 📦 Wrangler deployment ready

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation)
- [Discord Developer Portal](https://discord.com/developers/applications) access
- [ngrok account](https://dashboard.ngrok.com/signup) (for local development)

## Quick Start

### 1. Clone Repository

```
git clone https://github.com/shonya3/discord-bot-cf-worker.git
cd cloudflare-discord-bot-starter
```

### 2. Install Dependencies

```
pnpm install
```

### 3. Configure Envinronment

1. Copy the example environment file:

```
cp .dev.vars.example .dev.vars
```

2. Update .dev.vars with your credentials:

```
DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=
DISCORD_TOKEN=
```

### 4. Authenticate ngrok

1. Sign up at [ngrok](https://dashboard.ngrok.com/signup)
2. Get your authtoken from the dashboard
3. Run:

```
pnpm ngrok config add-authtoken your-auth-token-here
```

### 5. Authenticate Wrangler

```
npx wrangler login
```

## Development Workflow

### 1. Start Local Server

In your first terminal:

```
pnpm run dev
```

### 2. Start ngrok Tunnel

In a second terminal:

```
pnpm run ngrok
```

After starting, ngrok will display a forwarding URL like:
Forwarding https://5053-185-107-80-116.ngrok-free.app -> http://localhost:8787

### 3. Configure Discord Interactions Endpoint

1. Take your ngrok URL and append /interactions:

```
https://5053-185-107-80-116.ngrok-free.app/interactions
```

2. Go to your [Discord Application Settings](https://discord.com/developers/applications)
3. In "General Information" → "Interactions Endpoint URL":

- Paste your ngrok URL with /interactions
- Click "Save"

❗ **Important**: Your local server (`pnpm dev`) must be running when saving the URL, as Discord will immediately send a verification ping.

## Deployment

1. Deploy to production:

   Using pnpm:

```
pnpm run deploy
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
