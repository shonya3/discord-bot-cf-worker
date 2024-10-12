/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from 'hono';
import { InteractionResponseType, InteractionType } from 'discord-interactions';
import { is_valid_discord_interaction_request, DiscordResponse } from './discord';

const app = new Hono();

app.get('/', () => new Response('Hello, world!!!'));
app.post('/', async (c) => {
	const interaction = await is_valid_discord_interaction_request(c.req.raw);
	if (!interaction) {
		return new Response('Bad request signature.', { status: 401 });
	}

	if (interaction.type === InteractionType.PING) {
		return new DiscordResponse({ type: InteractionResponseType.PONG });
	}

	return new DiscordResponse({
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: { content: 'placeholder' },
	});
});

export default app;
