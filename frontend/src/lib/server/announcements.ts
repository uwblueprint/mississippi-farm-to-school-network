import { error, type Cookies } from '@sveltejs/kit';
import type { Announcement } from '$lib/types/announcement';
import { getGraphqlUrl } from '$lib/server/graphql-url';
import { devAdminToken } from './dev-auth';

export const ANNOUNCEMENT_FIELDS = `
	id
	message
	start_date
	end_date
	deleted_at
`;

export type AnnouncementDTO = {
	id: string;
	message: string;
	start_date: string;
	end_date: string | null;
	deleted_at: string | null;
};

export type GraphQLResponse<T> = {
	data?: T;
	errors?: { message: string; extensions?: { code?: string } }[];
};

async function post<T>(
	fetchFn: typeof fetch,
	token: string | undefined,
	query: string,
	variables?: Record<string, unknown>
): Promise<GraphQLResponse<T>> {
	const res = await fetchFn(getGraphqlUrl(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {})
		},
		body: JSON.stringify({ query, variables })
	});

	return res.json();
}

export async function gqlRequest<T>(
	fetchFn: typeof fetch,
	cookies: Cookies,
	query: string,
	variables?: Record<string, unknown>
): Promise<GraphQLResponse<T>> {
	const cookieToken = cookies.get('token');
	const token = cookieToken ?? (await devAdminToken());
	const body = await post<T>(fetchFn, token, query, variables);

	const unauthenticated = body.errors?.some((e) => e.extensions?.code === 'UNAUTHENTICATED');
	if (!cookieToken || !unauthenticated) return body;

	const fallback = await devAdminToken();
	if (!fallback) return body;
	return post<T>(fetchFn, fallback, query, variables);
}

function toDateOnly(iso: string): string {
	return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

export function toAnnouncement(dto: AnnouncementDTO): Announcement {
	return {
		id: dto.id,
		message: dto.message,
		startDate: toDateOnly(dto.start_date),
		endDate: dto.end_date ? toDateOnly(dto.end_date) : ''
	};
}

const LIST_QUERY = `
	query Announcements {
		liveAndUpcomingAnnouncements { ${ANNOUNCEMENT_FIELDS} }
		pastAnnouncements { ${ANNOUNCEMENT_FIELDS} }
	}
`;

export async function fetchAnnouncements(
	fetchFn: typeof fetch,
	cookies: Cookies
): Promise<Announcement[]> {
	const body = await gqlRequest<{
		liveAndUpcomingAnnouncements: AnnouncementDTO[];
		pastAnnouncements: AnnouncementDTO[];
	}>(fetchFn, cookies, LIST_QUERY);

	if (body.errors || !body.data) {
		throw error(502, body.errors?.[0]?.message ?? 'Failed to load announcements');
	}

	return [...body.data.liveAndUpcomingAnnouncements, ...body.data.pastAnnouncements]
		.filter((dto) => !dto.deleted_at)
		.map(toAnnouncement);
}
