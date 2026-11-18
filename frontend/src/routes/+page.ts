import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/** The old marketing home is gone — `/` goes straight to the public map. */
export const load: PageLoad = () => {
	redirect(307, '/farms');
};
