import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { gqlRequest } from '$lib/server/graphql';

const ME_QUERY = `
  query Me {
    me {
      id
      email
      firstName
      lastName
      phone
      role
    }
  }
`;

interface MeResponse {
	me: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		phone: string;
		role: string;
	} | null;
}

export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
	// Auth cookie + GraphQL `me` are not fully wired from Firebase login yet.
	// In dev, allow the form to load so onboarding → Add Farm can be tested.
	if (dev) {
		return { user: null };
	}

	const token = cookies.get('token');

	if (!token) {
		throw redirect(302, '/login');
	}

	let user: MeResponse['me'];
	try {
		({ me: user } = await gqlRequest<MeResponse>({ query: ME_QUERY, token, fetch }));
	} catch {
		user = null;
	}

	if (!user || user.role !== 'FARMER') {
		throw redirect(302, '/login');
	}

	return { user };
};
