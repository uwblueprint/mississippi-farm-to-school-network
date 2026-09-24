import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Deployed on Vercel: server routes (src/routes/api/**, +page.server.ts) run as
		// Vercel Functions, and every PR gets its own preview deployment.
		adapter: adapter()
	}
};

export default config;
