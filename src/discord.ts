import { verifyKey, InteractionResponseType, InteractionType, InteractionResponseFlags } from 'discord-interactions';
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
			flags?: InteractionResponseFlags;
		};
	}) {
		super(obj);
	}
}

export class DiscordMessageResponse extends DiscordResponse {
	constructor(content: string) {
		super({ type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content } });
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
			throw err.message;
		} else throw new Error(`Error fetching messages ${err}`);
	}
}

type Message = {
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

type Thread = {
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

type Mention = {
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

type Author = {
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
type Reaction = {
	emoji: Emoji;
	count: number;
	count_details: { burst: number; normal: number };
	burst_colors: Array<unknown>;
	me_burst: boolean;
	burst_me: boolean;
	me: boolean;
	burst_count: number;
};

type Emoji = {
	id: string;
	name: string;
};
