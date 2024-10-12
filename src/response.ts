export class JsonResponse extends Response {
	constructor(body: Record<PropertyKey, unknown>, options?: ResponseInit) {
		const opt = options ?? {};
		if (!opt.headers) {
			opt.headers = {
				'content-type': 'application/json',
			};
		}

		if (opt.headers instanceof Headers) {
			opt.headers.set('content-type', 'application/json');
		} else if (typeof opt.headers === 'object') {
			//@ts-ignore
			opt.headers['content-type'] = 'application/json';
		}

		super(JSON.stringify(body), options);
	}
}
