import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';

const rootDir = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
	// Load the repo-root .env so we can bridge canonical backend names into VITE_* for the client.
	const env = loadEnv(mode, rootDir, '');

	const firebaseApiKey = env.FIREBASE_WEB_API_KEY || env.VITE_FIREBASE_API_KEY || '';
	const firebaseStorageBucket =
		env.FIREBASE_STORAGE_DEFAULT_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET || '';
	const mapboxToken = env.MAPBOX_ACCESS_TOKEN || env.VITE_MAPBOX_ACCESS_TOKEN || '';
	const adminEmailDomain = env.ADMIN_EMAIL_DOMAIN || env.VITE_PUBLIC_ADMIN_EMAIL_DOMAIN || '';

	return {
		plugins: [tailwindcss(), sveltekit()],
		envDir: rootDir,
		define: {
			// Prefer a single root key; fall back to the old VITE_* name if still present.
			'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(firebaseApiKey),
			'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(firebaseStorageBucket),
			'import.meta.env.VITE_MAPBOX_ACCESS_TOKEN': JSON.stringify(mapboxToken),
			'import.meta.env.VITE_PUBLIC_ADMIN_EMAIL_DOMAIN': JSON.stringify(adminEmailDomain)
		}
	};
});
