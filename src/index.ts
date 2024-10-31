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
import { InteractionResponseFlags, InteractionResponseType, InteractionType } from 'discord-interactions';
import { is_valid_discord_interaction_request, DiscordResponse, fetch_channel_messages, create_msg_link } from './discord';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async () => new Response('hello!!!'));
app.post('/', async (c) => {
	const interaction = await is_valid_discord_interaction_request(c.req.raw);
	if (!interaction) {
		return new Response('Bad request signature.', { status: 401 });
	}

	if (interaction.type === InteractionType.PING) {
		return new DiscordResponse({ type: InteractionResponseType.PONG });
	}

	try {
		const guild_id = interaction.guild_id;
		const channel_id = interaction.channel_id;
		const messages = await fetch_channel_messages({
			bot_token: c.env.DISCORD_TOKEN,
			channel_id,
			limit: 100,
		});

		const filtered_messages = messages
			// Only messages with default type
			.filter((msg) => msg.type === 0)
			.filter((msg) => !msg.thread && !msg.reactions)
			.slice(-5)
			.reverse()
			.map((msg) => create_msg_link({ guild_id, channel_id, message_id: msg.id }))
			.join('\n');

		return new DiscordResponse({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: { content: filtered_messages, flags: InteractionResponseFlags.EPHEMERAL },
		});
	} catch (err) {
		return new DiscordResponse({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: { content: JSON.stringify(err) },
		});
	}
});

export default app;
