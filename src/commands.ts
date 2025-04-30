/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */

export const commands = {
	parse: {
		name: 'parse',
		description: 'Parse comments for reactions or threads',
	},
} as const;

export type CommandName = (typeof commands)[keyof typeof commands]['name'];
