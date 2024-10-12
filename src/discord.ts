import { verifyKey, InteractionResponseType, InteractionType } from 'discord-interactions';
import { JsonResponse } from './response';

const DISCORD_PUBLIC_KEY = '6905bc84c7ad6093a46b69f7bb3a33bd30935a6fcb6f76283146b62d3d6562d3';

export type InteractionRequestBody = Record<PropertyKey, unknown> & {
	type: InteractionType;
};

export async function is_valid_discord_interaction_request(request: Request): Promise<false | InteractionRequestBody> {
	try {
		const body = await request.text();
		const is_valid = await verifyKey(
			body,
			request.headers.get('x-signature-ed25519') ?? '',
			request.headers.get('x-signature-timestamp') ?? '',
			DISCORD_PUBLIC_KEY
		);
		if (is_valid) {
			return JSON.parse(body);
		}

		return false;
	} catch (err) {
		console.error(`Error validating discord request `, err);
		return false;
	}
}

export class DiscordResponse extends JsonResponse {
	constructor(obj: {
		type: InteractionResponseType;
		data?: {
			content?: string;
		};
	}) {
		super(obj);
	}
}
