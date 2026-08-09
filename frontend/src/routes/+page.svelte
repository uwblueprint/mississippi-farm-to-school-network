<script lang="ts">
	import ActionButton from '$lib/components/ActionButton.svelte';
</script>

<svelte:head>
	<title>Mississippi Farm to School Network</title>
</svelte:head>

<main class="home">
	<div class="home__media" aria-hidden="true">
		<img
			class="home__image"
			src="/images/farm-landscape.png"
			alt=""
			fetchpriority="high"
		/>
		<div class="home__veil"></div>
	</div>

	<div class="home__content">
		<img
			class="home__logo"
			src="/images/mfsnLogo.svg"
			alt=""
			width="100"
			height="100"
		/>

		<h1 class="home__brand">Mississippi Farm to School Network</h1>

		<p class="home__lede">
			Connect schools with local farms across Mississippi — fresh food, stronger communities.
		</p>

		<div class="home__actions">
			<ActionButton variant="primary" href="/farms" label="Farms" class="home__cta" />
			<ActionButton variant="outline" href="/login" label="Login" class="home__cta home__cta--login" />
		</div>
	</div>
</main>

<style>
	.home {
		position: relative;
		isolation: isolate;
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1.5rem, 4vw, 3rem);
		overflow: hidden;
		background: var(--mfsn-primary-700, #152608);
	}

	.home__media {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.home__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		transform: scale(1.04);
		animation: home-image-settle 1.4s ease-out both;
	}

	.home__veil {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				160deg,
				rgba(21, 38, 8, 0.72) 0%,
				rgba(38, 61, 19, 0.55) 45%,
				rgba(21, 38, 8, 0.78) 100%
			);
	}

	.home__content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1.25rem;
		width: min(36rem, 100%);
		animation: home-content-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
	}

	.home__logo {
		width: 5.5rem;
		height: 5.5rem;
		filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.25));
		animation: home-logo-in 0.7s ease-out both;
	}

	.home__brand {
		margin: 0;
		font-family: var(--font-figtree, 'Figtree', sans-serif);
		font-size: clamp(1.75rem, 4.5vw, 2.5rem);
		font-weight: var(--font-weight-medium, 500);
		line-height: 1.2;
		letter-spacing: -0.02em;
		color: #ffffff;
		text-wrap: balance;
	}

	.home__lede {
		margin: 0;
		max-width: 28rem;
		font-family: var(--font-dm-sans, 'DM Sans', sans-serif);
		font-size: clamp(1rem, 2.2vw, 1.25rem);
		font-weight: var(--font-weight-regular, 400);
		line-height: 1.45;
		color: rgba(255, 255, 255, 0.88);
		text-wrap: pretty;
	}

	.home__actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.875rem;
		margin-top: 0.75rem;
		width: 100%;
		animation: home-actions-in 0.7s ease-out 0.35s both;
	}

	.home__actions :global(.home__cta) {
		min-width: 9.5rem;
	}

	.home__actions :global(.home__cta--login) {
		border-color: rgba(255, 255, 255, 0.85);
		background: rgba(255, 255, 255, 0.12);
		color: #ffffff;
		backdrop-filter: blur(6px);
	}

	.home__actions :global(.home__cta--login:hover:not(:disabled)) {
		background: rgba(255, 255, 255, 0.22);
		border-color: #ffffff;
	}

	@keyframes home-image-settle {
		from {
			transform: scale(1.1);
			opacity: 0.7;
		}
		to {
			transform: scale(1.04);
			opacity: 1;
		}
	}

	@keyframes home-content-rise {
		from {
			opacity: 0;
			transform: translateY(1.25rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes home-logo-in {
		from {
			opacity: 0;
			transform: scale(0.92);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes home-actions-in {
		from {
			opacity: 0;
			transform: translateY(0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 480px) {
		.home__actions {
			flex-direction: column;
			align-items: stretch;
		}

		.home__actions :global(.home__cta) {
			width: 100%;
			min-width: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.home__image,
		.home__content,
		.home__logo,
		.home__actions {
			animation: none;
		}

		.home__image {
			transform: none;
		}
	}
</style>
