import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// The onboarding tour now runs on the farms dashboard itself.
export const load: PageLoad = () => {
	redirect(307, '/farmer/farms');
};
