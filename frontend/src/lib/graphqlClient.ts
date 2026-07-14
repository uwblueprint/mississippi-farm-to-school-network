// Browser-side GraphQL client for the client-rendered (protected) area.
//
// The (protected) subtree is `ssr = false` and gates on client-side Firebase
// auth, so it authenticates to the backend with the current user's Firebase ID
// token (Authorization: Bearer) rather than a server-readable cookie. The
// backend allows this cross-origin (CORS *). Server-only code (+page.server.ts,
// +layout.server.ts) should keep using $lib/server/graphql instead.
import { getFirebaseAuth } from '$lib/firebase';

// Browser-reachable backend URL. Defaults to the docker-compose-exposed port for
// local dev; override via VITE_PUBLIC_GRAPHQL_URL for other environments.
const GRAPHQL_URL = import.meta.env.VITE_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3000/graphql';

// Minimal structural shape of a Firebase user (avoids importing the unresolved
// `firebase/auth` types, which svelte-check can't resolve in this project).
type AuthedUser = { getIdToken(): Promise<string> };

// Resolve the current user once Firebase has restored its initial auth state.
// On a hard load/refresh `currentUser` is briefly null until Firebase rehydrates
// from persistence, so wait for the first auth-state emission. Uses the auth
// instance's own onAuthStateChanged method to avoid a direct firebase/auth import.
function currentUserReady(auth: ReturnType<typeof getFirebaseAuth>): Promise<AuthedUser | null> {
	if (auth.currentUser) {
		return Promise.resolve(auth.currentUser);
	}
	return new Promise((resolve) => {
		const unsubscribe = auth.onAuthStateChanged((user: AuthedUser | null) => {
			unsubscribe();
			resolve(user);
		});
	});
}

export async function gqlClient<T>(
	query: string,
	variables?: Record<string, unknown>
): Promise<T> {
	const user = await currentUserReady(getFirebaseAuth());
	if (!user) {
		throw new Error('You must be signed in.');
	}

	const token = await user.getIdToken();
	const res = await fetch(GRAPHQL_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ query, variables })
	});

	const json = await res.json();
	if (json.errors?.length) {
		throw new Error(json.errors[0]?.message ?? 'GraphQL request failed');
	}
	return json.data as T;
}
