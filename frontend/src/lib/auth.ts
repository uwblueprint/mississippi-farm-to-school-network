import { FirebaseError } from 'firebase/app';
import {
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	type AuthError,
	type UserCredential
} from 'firebase/auth';
import { getFirebaseAuth } from '$lib/firebase';

const ADMIN_EMAIL_DOMAIN = '@mississippifarmtoschool.org';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
	'auth/weak-password': 'Password is too weak. Please meet all requirements below.'
};

const LOGIN_PASSWORD_ERROR_CODES = new Set([
	'auth/wrong-password',
	'auth/invalid-credential',
	'auth/user-not-found'
]);

export const EMAIL_VERIFICATION_ERROR =
	'Please check your email to verify your account before logging in';

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
		return { field: 'password', message: 'Invalid email or password ' };
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

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
	const auth = getFirebaseAuth();
	return signInWithEmailAndPassword(auth, email, password);
}

export async function signupWithEmail(email: string, password: string) {
	const auth = getFirebaseAuth();
	return createUserWithEmailAndPassword(auth, email, password);
}

export async function sendPasswordReset(email: string) {
	const auth = getFirebaseAuth();
	return sendPasswordResetEmail(auth, email);
}
