/**
 * Server-only GraphQL helper for talking to the backend.
 *
 * Mirrors the inline fetch pattern used in the SvelteKit server load files
 * (see new-farm/+layout.server.ts and +layout.server.ts): same endpoint,
 * same `Authorization: Bearer <token>` header sourced from the `token` cookie.
 *
 * SERVER ONLY — safe to import from +page.server.ts / +layout.server.ts / actions.
 * Do NOT import from client components (it hits the internal docker host).
 */

const GRAPHQL_ENDPOINT = 'http://mfsn-backend:3000/graphql';

interface GraphQLError {
	message: string;
	[key: string]: unknown;
}

interface GraphQLResponse<T> {
	data?: T;
	errors?: GraphQLError[];
}

export interface GqlRequestOptions {
	/** The GraphQL query or mutation document. */
	query: string;
	/** Optional variables for the operation. */
	variables?: Record<string, unknown>;
	/** Firebase ID token (from cookies.get('token')) to send as a Bearer token. */
	token?: string;
	/** SvelteKit's `fetch` from the load/action event. Falls back to global fetch. */
	fetch?: typeof fetch;
}

/**
 * Execute a GraphQL request against the backend and return the typed `data`.
 *
 * Throws with a useful message on a non-200 response or when the payload
 * contains GraphQL `errors`.
 */
export async function gqlRequest<T>(opts: GqlRequestOptions): Promise<T> {
	const { query, variables, token, fetch: fetchFn = fetch } = opts;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const res = await fetchFn(GRAPHQL_ENDPOINT, {
		method: 'POST',
		headers,
		body: JSON.stringify({ query, variables })
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(
			`GraphQL request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`
		);
	}

	const json = (await res.json()) as GraphQLResponse<T>;

	if (json.errors && json.errors.length > 0) {
		throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`);
	}

	if (json.data == null) {
		throw new Error('GraphQL response contained no data');
	}

	return json.data;
}
