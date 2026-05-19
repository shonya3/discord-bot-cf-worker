export class JsonResponse extends Response {
  constructor(body: Record<PropertyKey, unknown>, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    headers.set("content-type", "application/json");

    super(JSON.stringify(body), { ...init, headers });
  }
}
