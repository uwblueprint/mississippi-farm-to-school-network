// Farmer onboarding progress, kept per user in localStorage. The tour runs on the
// farms dashboard: it starts for a farmer with no farms, sends them to the
// create-farm form, then resumes at the dashboard steps when they come back
// (whether they submitted or backed out).

const COMPLETED_KEY = 'mfsn.farmerOnboarding.completed';
const ADD_FARM_OPENED_KEY = 'mfsn.farmerOnboarding.addFarmOpened';

/** Index of the first dashboard step, shown after the create-farm form. */
export const RESUME_STEP = 2;

const keyFor = (base: string, uid: string) => `${base}:${uid}`;

function read(key: string): boolean {
	try {
		return localStorage.getItem(key) === '1';
	} catch {
		return false;
	}
}

function write(key: string) {
	try {
		localStorage.setItem(key, '1');
	} catch {
		// quota / private mode: the tour may show again, which is harmless
	}
}

/** The step the tour should open on, or null when it shouldn't show. */
export function onboardingStartStep(uid: string, farmCount: number): number | null {
	if (read(keyFor(COMPLETED_KEY, uid))) return null;
	if (read(keyFor(ADD_FARM_OPENED_KEY, uid))) return RESUME_STEP;
	if (farmCount === 0) return 0;
	// Farmers who already have farms don't need to be walked through adding one.
	markOnboardingComplete(uid);
	return null;
}

export function markAddFarmOpened(uid: string) {
	write(keyFor(ADD_FARM_OPENED_KEY, uid));
}

export function markOnboardingComplete(uid: string) {
	write(keyFor(COMPLETED_KEY, uid));
	try {
		localStorage.removeItem(keyFor(ADD_FARM_OPENED_KEY, uid));
	} catch {
		// ignore
	}
}
