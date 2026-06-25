import type { LayoutServerLoad } from './$types';

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
		return { user: null };
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

	if (json.errors || !json.data?.me) {
		return { user: null };
	}

	return {
		user: {
			id: json.data.me.id,
			email: json.data.me.email,
			firstName: json.data.me.firstName,
			lastName: json.data.me.lastName,
			phone: json.data.me.phone,
			role: json.data.me.role
		}
	};
};
