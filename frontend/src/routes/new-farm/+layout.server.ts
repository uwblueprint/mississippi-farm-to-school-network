import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

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

export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
	const token = cookies.get('token');

	if (!token) {
		throw redirect(302, '/login');
	}

	const res = await fetch('http://mfsn-backend:3000/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({ query: ME_QUERY })
	});

	const json = await res.json();

	const user = json.data?.me;

	if (!user) {
		throw redirect(302, '/login');
	}

	if (user.role !== 'FARMER') {
		throw redirect(302, '/login');
	}

	return {
		user
	};
};
