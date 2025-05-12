import { verifyKey, InteractionResponseType, InteractionType, InteractionResponseFlags, ChannelTypes } from 'discord-interactions';
import { JsonResponse } from './response';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export const validate_interaction_middleware = createMiddleware<{
	Bindings: Env;
	Variables: {
		interaction: Interaction;
	};
}>(async (c, next) => {
	const interaction = await is_valid_discord_interaction_request(c.req.raw, c.env.DISCORD_PUBLIC_KEY);
	if (!interaction) {
		throw new HTTPException(401, { message: 'Invalid discord interaction request' });
	}

	if (interaction.type === InteractionType.PING) {
		return new DiscordResponse({ type: InteractionResponseType.PONG });
	}

	c.set('interaction', interaction);

	await next();
});

export async function is_valid_discord_interaction_request(request: Request, bot_public_key: string): Promise<false | Interaction> {
	try {
		const body = await request.text();
		const is_valid = await verifyKey(
			body,
			request.headers.get('x-signature-ed25519') ?? '',
			request.headers.get('x-signature-timestamp') ?? '',
			bot_public_key
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

export function reply(content: string | { content: string; ephemeral?: boolean }): DiscordResponse {
	if (typeof content === 'string') {
		return new DiscordResponse({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: { content },
		});
	}

	return new DiscordResponse({
		type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
		data: {
			content: content.content,
			flags: content.ephemeral ? InteractionResponseFlags.EPHEMERAL : undefined,
		},
	});
}

export class DiscordResponse extends JsonResponse {
	constructor(obj: {
		type: InteractionResponseType;
		data?: {
			content?: string;
			flags?: InteractionResponseFlags;
		};
	}) {
		super(obj);
	}
}

type FetchChannelMessagesArgs = {
	channel_id: string;
	bot_token: string;
	limit: number;
};

export function create_msg_link({ guild_id, channel_id, message_id }: { guild_id: string; channel_id: string; message_id: string }) {
	return `https://discord.com/channels/${guild_id}/${channel_id}/${message_id}`;
}

export async function fetch_channel_messages({ channel_id, bot_token, limit }: FetchChannelMessagesArgs): Promise<Array<Message>> {
	try {
		const response = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages?limit=${limit}`, {
			headers: {
				Authorization: `Bot ${bot_token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Error fetching messages: ${response.statusText}`);
		}

		return await response.json();
	} catch (err: unknown) {
		if (err instanceof Error) {
			err.message = `Error fetching messages ${err.message}`;
			throw err;
		} else throw new Error(`Error fetching messages ${err}`);
	}
}

type CommonInteractionFields = {
	app_permissions: string;
	application_id: string;
	authorizing_integration_owners: Record<PropertyKey, Guild['id']>;
	channel: Channel;
	channel_id: Channel['id'];
	context: number;
	entitlement_sku_ds: Array<unknown>;
	entitlements: Array<unknown>;
	guild: Guild;
	guild_id: Guild['id'];
	guild_locale: string;
	id: string;
	locale: string;
	member: Member;
};

export type AnotherInteraction = CommonInteractionFields & {
	type: InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE | InteractionType.MODAL_SUBMIT | InteractionType.PING;
};

export type ComponentInteraction = CommonInteractionFields & {
	type: InteractionType.MESSAGE_COMPONENT;
	data: {
		component_type: 2;
		custom_id: string;
		id: number;
	};
};

export type CommandInteraction = CommonInteractionFields & {
	type: InteractionType.APPLICATION_COMMAND;
	data: {
		id: number;
		name: string;
	};
};

export type Interaction = ComponentInteraction | CommandInteraction | AnotherInteraction;

export type Message = {
	type: number;
	content: string;
	mentions: Array<Mention>;
	attachments: Array<unknown>;
	embeds: Array<unknown>;
	timestamp: string;
	edited_timestamp: string | null;
	flags: number;
	components: Array<unknown>;
	id: string;
	channel_id: string;
	author: Author;
	pinned: boolean;
	mention_everyone: boolean;
	tts: boolean;
	thread?: Thread;
	reactions?: Array<Reaction>;
};

export type Thread = {
	/**
	 * The id of the parent message.
	 */
	parent_id: string;
	id: string;
	type: number;
	last_message_id: string;
	flags: number;
	guild_id: string;
	name: string;
	rate_limit_per_user: number;
	bitrate: number;
	user_limit: number;
	rtc_region: unknown | null;
	owner_id: Author['id'];
	thread_metadata: {
		archived: boolean;
		archive_timestamp: string;
		auto_archive_duration: number;
		locked: boolean;
		create_timestamp: string;
	};
};

export type Mention = {
	id: string;
	username: string;
	avatar: string | null;
	public_flags: number;
	flags: number;
	banner: string | null;
	accent_color: string | null;
	global_name: string;
	avatar_decoration_data: string | null;
	banner_color: string | null;
	clan: string | null;
};

export type Author = {
	id: string;
	username: string;
	avatar: string;
	descriminator: string;
	public_flags: number;
	flags: number;
	banner: string | null;
	accent_color: string | null;
	global_name: string;
	avatarr_decoration_data: null;
	banner_color: string | null;
	clan: string | null;
};
export type Reaction = {
	emoji: Emoji;
	count: number;
	count_details: { burst: number; normal: number };
	burst_colors: Array<unknown>;
	me_burst: boolean;
	burst_me: boolean;
	me: boolean;
	burst_count: number;
};

export type Emoji = {
	id: string;
	name: string;
};

export type Guild = {
	features: Array<unknown>;
	id: string;
	locale: string;
};

export type Channel = {
	flags: number;
	guild_id: Guild['id'];
	id: string;
	last_message_id: string;
	name: string;
	nsfw: boolean;
	parent_id: string;
	permissions: string;
	position: number;
	rate_limit_per_user: number;
	topic: null | unknown;
	type: ChannelTypes;
};

export type Member = {
	avatar: null | unknown;
	banner: null | unknown;
	communication_disabled_until: null | unknown;
	deaf: boolean;
	flags: number;
	joined_at: string;
	mute: boolean;
	nick: null | unknown;
	pending: boolean;
	permissions: string;
	premium_since: null | string;
	roles: Array<unknown>;
	unusual_dm_activity_until: null | unknown;
	user: Author;
};
