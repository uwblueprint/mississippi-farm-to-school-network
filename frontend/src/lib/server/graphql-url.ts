import { env } from '$env/dynamic/private';

/** Backend GraphQL endpoint for SvelteKit server routes. Defaults to local npm dev. */
export function getGraphqlUrl(): string {
	return env.GRAPHQL_URL ?? 'http://localhost:3000/graphql';
}
