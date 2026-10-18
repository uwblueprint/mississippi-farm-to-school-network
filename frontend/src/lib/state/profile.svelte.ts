import { gqlClient } from '$lib/graphqlClient';
import type { UserRole } from '$lib/types/admin';

export type Profile = {
	email: string;
	role: UserRole;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
};

const PROFILE_FIELDS = `email role firstName lastName phone`;

const MY_PROFILE = `
	query MyProfile {
		myProfile { ${PROFILE_FIELDS} }
	}
`;

const UPDATE_MY_PROFILE = `
	mutation UpdateMyProfile($input: UpdateMyProfileInput!) {
		updateMyProfile(input: $input) { ${PROFILE_FIELDS} }
	}
`;

let current = $state<Profile | null>(null);

export const profile = {
	get current() {
		return current;
	}
};

export function profileFullName(p: Profile | null): string {
	return [p?.firstName, p?.lastName].filter(Boolean).join(' ');
}

export function roleLabel(role: UserRole): string {
	return role === 'ADMIN' ? 'Admin' : 'Farmer';
}

export async function loadProfile(): Promise<Profile> {
	const data = await gqlClient<{ myProfile: Profile }>(MY_PROFILE);
	current = data.myProfile;
	return current;
}

/** Saves a single "Full Name" field by splitting it into first name and the rest. */
export async function saveProfile(input: { name: string; phone: string }): Promise<Profile> {
	const [firstName, ...rest] = input.name.trim().split(/\s+/);
	const data = await gqlClient<{ updateMyProfile: Profile }>(UPDATE_MY_PROFILE, {
		input: { firstName: firstName ?? '', lastName: rest.join(' '), phone: input.phone }
	});
	current = data.updateMyProfile;
	return current;
}

export function clearProfile() {
	current = null;
}
