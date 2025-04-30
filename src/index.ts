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
import { fetch_channel_messages, create_msg_link, validate_interaction_middleware, reply } from './discord';
import { HTTPException } from 'hono/http-exception';
import { CommandName } from './commands';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async () => new Response('hello!!!'));
app.post('/interaction', validate_interaction_middleware, async (c) => {
	const { interaction } = c.var;
	const guild_id = interaction.guild_id;
	const channel_id = interaction.channel_id;

	try {
		switch (interaction.data.name as CommandName) {
			case 'parse':
				return await handle_parse_command({ bot_token: c.env.DISCORD_TOKEN, guild_id, channel_id });

			default:
				return reply(`Unknown command: ${interaction.data.name}`);
		}
	} catch (err) {
		console.error(err);
		return reply({ content: 'An error occurred while processing your command.', ephemeral: true });
	}
});

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return err.getResponse();
	}
	return c.text('Internal Server Error', 500);
});

export default app;

async function handle_parse_command({ channel_id, guild_id, bot_token }: { channel_id: string; guild_id: string; bot_token: string }) {
	const messages = await fetch_channel_messages({
		bot_token,
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
}
