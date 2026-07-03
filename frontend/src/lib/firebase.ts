import { browser } from '$app/environment';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
	if (!browser) {
		throw new Error('Firebase Auth is only available in the browser');
	}

	if (!auth) {
		app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
		auth = getAuth(app);
	}

	return auth;
}
