import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

let cached: { token: string; expiresAt: number } | null = null;

export async function devAdminToken(): Promise<string | undefined> {
	if (!dev || !env.DEV_ADMIN_REFRESH_TOKEN || !env.DEV_FIREBASE_WEB_API_KEY) return undefined;
	if (cached && Date.now() < cached.expiresAt) return cached.token;

	const res = await fetch(
		`https://securetoken.googleapis.com/v1/token?key=${env.DEV_FIREBASE_WEB_API_KEY}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: env.DEV_ADMIN_REFRESH_TOKEN
			})
		}
	);
	if (!res.ok) return undefined;

	const body = await res.json();
	cached = {
		token: body.id_token,
		expiresAt: Date.now() + (Number(body.expires_in) - 60) * 1000
	};
	return cached.token;
}
