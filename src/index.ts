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

import { getCuteUrl } from './reddit';
const DISCORD_PUBLIC_KEY = '6905bc84c7ad6093a46b69f7bb3a33bd30935a6fcb6f76283146b62d3d6562d3';
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';

export default {
	async fetch(request, env): Promise<Response> {
		const { isValid, interaction } = await verify(request, env);
		if (!isValid || !interaction) {
			return new Response('Bad request signature.', { status: 401 });
		}

		if (interaction.type === InteractionType.PING) {
			return new Response(
				JSON.stringify({
					type: InteractionResponseType.PONG,
				}),
				{ headers: 'application/json' }
			);
		}

		return new Response(
			JSON.stringify({
				type: 4,
				data: {
					content: await getCuteUrl(),
				},
			}),
			{ headers: { 'content-type': 'application/json' } }
		);
	},
} satisfies ExportedHandler<Env>;

const verify = async (request: Request, env: Env) => {
	const signature = request.headers.get('x-signature-ed25519');
	const timestamp = request.headers.get('x-signature-timestamp');
	const body = await request.text();
	const isValidRequest = signature && timestamp && (await verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY));
	if (!isValidRequest) {
		return { isValid: false };
	}

	return { interaction: JSON.parse(body), isValid: true };
};
