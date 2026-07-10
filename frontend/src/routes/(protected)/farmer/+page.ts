import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// /farmer is the farmer's home; the canonical farms list lives at /farmer/farms.
export const load: PageLoad = () => {
	redirect(307, '/farmer/farms');
};
