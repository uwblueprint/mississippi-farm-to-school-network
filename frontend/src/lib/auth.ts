import { FirebaseError } from 'firebase/app';
import {
	createUserWithEmailAndPassword,
	onIdTokenChanged,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
	type AuthError,
	type Unsubscribe,
	type User,
	type UserCredential
} from 'firebase/auth';
import { getFirebaseAuth } from '$lib/firebase';

const ADMIN_EMAIL_DOMAIN = '@mississippifarmtoschool.org';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Cookie name expected by SvelteKit server routes (`create-farm`, `new-farm` layout). */
export const AUTH_TOKEN_COOKIE = 'token';


export type PasswordRequirement = {
	id: string;
	label: string;
	test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
	{ id: 'length', label: 'Minimum 8 characters', test: (p) => p.length >= 8 },
	{ id: 'uppercase', label: '1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
	{ id: 'number', label: '1 number', test: (p) => /[0-9]/.test(p) },
	{ id: 'symbol', label: '1 symbol', test: (p) => /[^A-Za-z0-9]/.test(p) }
];

const FIREBASE_AUTH_ERRORS: Record<string, string> = {
	'auth/invalid-email': 'Please enter a valid email address.',
	'auth/user-disabled': 'This account has been disabled.',
	'auth/user-not-found': 'No account found with this email.',
	'auth/wrong-password': 'Incorrect password. Please try again.',
	'auth/invalid-credential': 'Invalid email or password. Please try again.',
	'auth/too-many-requests': 'Too many attempts. Please try again later.',
	'auth/network-request-failed': 'Network error. Check your connection and try again.',
	'auth/email-already-in-use': 'An account with this email already exists.',
	'auth/weak-password': 'Password is too weak. Please meet all requirements below.',
	'auth/invalid-action-code': 'This verification link is invalid or has already been used.',
	'auth/expired-action-code': 'This verification link has expired. Please request a new one.'
};

const LOGIN_PASSWORD_ERROR_CODES = new Set([
	'auth/wrong-password',
	'auth/invalid-credential',
	'auth/user-not-found'
]);

export const EMAIL_ALREADY_IN_USE_ERROR = 'An account with this email already exists.';

export type LoginFieldError = {
	field: 'email' | 'password';
	message: string;
};

export function isEmailValid(email: string): boolean {
	return email.length > 0 && EMAIL_REGEX.test(email);
}

export function isPasswordValid(password: string): boolean {
	return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
}

export function getAuthErrorMessage(error: unknown): string {
	if (isAuthError(error)) {
		return FIREBASE_AUTH_ERRORS[error.code] ?? error.message;
	}

	return 'Something went wrong. Please try again.';
}

export function getLoginFieldError(error: unknown): LoginFieldError | null {
	if (!isAuthError(error)) {
		return null;
	}

	if (LOGIN_PASSWORD_ERROR_CODES.has(error.code)) {
		return { field: 'password', message: 'Invalid email or password' };
	}

	return null;
}

export function isEmailAlreadyInUseError(error: unknown): boolean {
	return isAuthError(error) && error.code === 'auth/email-already-in-use';
}

function isAuthError(error: unknown): error is AuthError {
	return error instanceof FirebaseError && error.code.startsWith('auth/');
}

export function isAdminEmail(email: string): boolean {
	return email.toLowerCase().endsWith(ADMIN_EMAIL_DOMAIN);
}

export function getPostAuthDestination(email: string, _context: 'login' | 'verified'): string {
	if (isAdminEmail(email)) {
		return '/admin';
	}

	// Farmers see helper pop-ups on /onboarding first, then continue to /farmer.
	return '/onboarding';
}

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
	const auth = getFirebaseAuth();
	return signInWithEmailAndPassword(auth, email, password);
}

export async function signupWithEmail(email: string, password: string): Promise<UserCredential> {
	const auth = getFirebaseAuth();
	return createUserWithEmailAndPassword(auth, email, password);
}

export async function sendEmailVerificationHandler(user?: User) {
	const auth = getFirebaseAuth();
	const targetUser = user ?? auth.currentUser;

	if (!targetUser) {
		throw new Error('No signed-in user.');
	}

	return sendEmailVerification(targetUser, {
		url: `${window.location.origin}/verify-email/success`
	});
}

export async function sendPasswordResetEmailHandler(email: string) {
	const auth = getFirebaseAuth();
	return sendPasswordResetEmail(auth, email, {
		url: `${window.location.origin}/reset-password/success`
	});
}

/**
 * Writes the Firebase ID token into a cookie so SvelteKit server routes can
 * forward `Authorization: Bearer <token>` to GraphQL.
 */
export function setAuthTokenCookie(idToken: string): void {
	const secure =
		typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
	document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(idToken)}; path=/; Max-Age=3600; SameSite=Lax${secure}`;
}

export function clearAuthTokenCookie(): void {
	document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}

/** Sync the `token` cookie from the current Firebase user (or clear it). */
export async function syncAuthTokenCookie(user: User | null): Promise<void> {
	if (!user) {
		clearAuthTokenCookie();
		return;
	}

	const idToken = await user.getIdToken();
	setAuthTokenCookie(idToken);
}

/**
 * Keep the `token` cookie aligned with Firebase Auth.
 * Call once from the root layout; returns an unsubscribe function.
 */
export function subscribeAuthTokenCookie(): Unsubscribe {
	const auth = getFirebaseAuth();
	return onIdTokenChanged(auth, (user) => {
		void syncAuthTokenCookie(user);
	});
}

export async function logout(): Promise<void> {
	const auth = getFirebaseAuth();
	clearAuthTokenCookie();
	await signOut(auth);
}
