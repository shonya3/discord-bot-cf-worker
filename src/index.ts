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
import { InteractionResponseFlags, InteractionResponseType } from 'discord-interactions';
import { DiscordResponse, fetch_channel_messages, create_msg_link, validate_interaction_middleware, reply } from './discord';
import { HTTPException } from 'hono/http-exception';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async () => new Response('hello!!!'));
app.post('/interaction', validate_interaction_middleware, async (c) => {
	const { interaction } = c.var;

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

		return reply({ content: filtered_messages, ephemeral: true });
	} catch (err) {
		return reply(JSON.stringify(err));
	}
});

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return err.getResponse();
	}
	return c.text('Internal Server Error', 500);
});

export default app;
