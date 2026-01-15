type Env = {
	MARKETING_ORIGIN: string;
	MARKETING_HOST?: string;
};

const rewriteRequest = (
	req: Request,
	targetOrigin: string,
	hostOverride?: string,
) => {
	const targetUrl = new URL(req.url);
	const originUrl = new URL(targetOrigin);

	targetUrl.protocol = originUrl.protocol;
	targetUrl.host = originUrl.host;

	const headers = new Headers(req.headers);
	if (hostOverride) {
		headers.set("host", hostOverride);
	}

	return new Request(targetUrl.toString(), {
		method: req.method,
		headers,
		body: req.body,
		redirect: "manual",
	});
};

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		if (!env.MARKETING_ORIGIN) {
			return new Response("Missing MARKETING_ORIGIN", { status: 500 });
		}

		// Proxy everything to marketing site (Vercel)
		// Note: /spendin/* is handled by the spendin worker directly via Cloudflare routes
		return fetch(rewriteRequest(req, env.MARKETING_ORIGIN, env.MARKETING_HOST));
	},
};
