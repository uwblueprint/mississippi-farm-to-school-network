import type { LayoutServerLoad } from './$types';
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
	const token = cookies.get('token');

	if (!token) {
		return { user: null };
	}

	// Any failure (network, GraphQL error, expired token) degrades to signed-out.
	try {
		const { me } = await gqlRequest<MeResponse>({ query: ME_QUERY, token, fetch });
		return { user: me ?? null };
	} catch {
		return { user: null };
	}
};
