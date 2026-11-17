<script lang="ts" module>
	export type MobileNavItem = {
		href: string;
		label: string;
		/** Only highlight on an exact path match (e.g. the `/admin` index). */
		exact?: boolean;
		/** Opens in a new tab (e.g. Contact MFSN). */
		external?: boolean;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { logout } from '$lib/auth';
	import { clearProfile } from '$lib/state/profile.svelte';

	/**
	 * Phone-only (< 768px) top bar for the farmer and admin portals. Replaces the
	 * persistent sidebar: the menu button drops a full-width menu down from under
	 * the bar with the same nav links, plus the account actions that live in the
	 * sidebar's profile block on desktop. Hidden by CSS at 768px and up.
	 */
	interface Props {
		items: MobileNavItem[];
		logoSrc: string;
		/** Where tapping the logo goes. */
		homeHref: string;
		profileName: string;
		profileRole: string;
		profileHref: string;
		avatarUrl?: string;
	}

	let { items, logoSrc, homeHref, profileName, profileRole, profileHref, avatarUrl }: Props =
		$props();

	const MENU_ID = 'mobile-nav-menu';

	let open = $state(false);
	let loggingOut = $state(false);
	let toggleButton = $state<HTMLButtonElement | null>(null);
	let reduceMotion = $state(false);

	const duration = $derived(reduceMotion ? 0 : 180);
	const path = $derived(page.url.pathname);

	function isActive(item: MobileNavItem): boolean {
		if (item.external) return false;
		return item.exact ? path === item.href : path === item.href || path.startsWith(item.href + '/');
	}

	function close({ restoreFocus = false } = {}) {
		if (!open) return;
		open = false;
		if (restoreFocus) toggleButton?.focus();
	}

	async function handleLogout() {
		loggingOut = true;
		try {
			await logout();
			clearProfile();
			await goto('/login', { replaceState: true });
		} finally {
			loggingOut = false;
			close();
		}
	}

	// Any route change (link tap, browser back) closes the menu.
	afterNavigate(() => close());

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// Growing past the breakpoint hides this bar; don't leave the scroll lock on.
		const desktop = window.matchMedia('(min-width: 768px)');
		const onChange = (event: MediaQueryListEvent) => {
			if (event.matches) close();
		};
		desktop.addEventListener('change', onChange);
		return () => desktop.removeEventListener('change', onChange);
	});

	// Lock the page behind the open menu.
	$effect(() => {
		if (!open) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});

	function handleKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			event.preventDefault();
			close({ restoreFocus: true });
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="mobile-nav">
	<header class="mobile-nav__bar">
		<a href={homeHref} class="mobile-nav__logo">
			<img src={logoSrc} alt="Mississippi Farm to School Network" />
		</a>

		<button
			bind:this={toggleButton}
			type="button"
			class="mobile-nav__toggle"
			aria-expanded={open}
			aria-controls={MENU_ID}
			aria-label={open ? 'Close menu' : 'Open menu'}
			onclick={() => (open ? close() : (open = true))}
		>
			{#if open}
				<!-- lucide "x" -->
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M18 6L6 18M6 6L18 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{:else}
				<!-- lucide "menu" -->
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M4 6H20M4 12H20M4 18H20"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
		</button>
	</header>

	{#if open}
		<button
			type="button"
			class="mobile-nav__overlay"
			aria-label="Close menu"
			tabindex="-1"
			onclick={() => close()}
			transition:fade={{ duration }}
		></button>

		<div id={MENU_ID} class="mobile-nav__menu" transition:slide={{ duration }}>
			<nav class="mobile-nav__links" aria-label="Main">
				{#each items as item (item.href)}
					<a
						href={item.href}
						class="mobile-nav__link"
						class:mobile-nav__link--active={isActive(item)}
						aria-current={isActive(item) ? 'page' : undefined}
						target={item.external ? '_blank' : undefined}
						rel={item.external ? 'noopener noreferrer' : undefined}
						onclick={() => close()}
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="mobile-nav__account">
				<div class="mobile-nav__profile">
					{#if avatarUrl}
						<span class="mobile-nav__avatar" style="background-image: url('{avatarUrl}')"></span>
					{:else}
						<span class="mobile-nav__avatar mobile-nav__avatar--initial" aria-hidden="true">
							{profileName.charAt(0).toUpperCase()}
						</span>
					{/if}
					<span class="mobile-nav__profile-text">
						<span class="mobile-nav__profile-name">{profileName}</span>
						<span class="mobile-nav__profile-role">{profileRole}</span>
					</span>
				</div>

				<a
					href={profileHref}
					class="mobile-nav__link"
					class:mobile-nav__link--active={path === profileHref}
					onclick={() => close()}
				>
					View profile
				</a>
				<button
					type="button"
					class="mobile-nav__link mobile-nav__link--danger"
					disabled={loggingOut}
					onclick={handleLogout}
				>
					{loggingOut ? 'Logging out…' : 'Log out'}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.mobile-nav {
		--mobile-nav-height: 56px;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
	}

	@media (min-width: 768px) {
		.mobile-nav {
			display: none;
		}
	}

	.mobile-nav__bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-sizing: content-box;
		height: var(--mobile-nav-height);
		padding: env(safe-area-inset-top) max(8px, env(safe-area-inset-right)) 0
			max(16px, env(safe-area-inset-left));
		border-bottom: 1.5px solid #f5f6f8; /* --Neutral-200, matches the sidebar border */
		background: #fff;
	}

	.mobile-nav__logo {
		display: flex;
		align-items: center;
		border-radius: 8px;
	}

	.mobile-nav__logo img {
		display: block;
		width: 40px;
		height: 40px;
		object-fit: contain;
	}

	.mobile-nav__toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: #131927;
		cursor: pointer;
	}

	.mobile-nav__toggle:focus-visible,
	.mobile-nav__logo:focus-visible,
	.mobile-nav__link:focus-visible {
		outline: 2px solid var(--mfsn-primary, #587244);
		outline-offset: -2px;
	}

	/* Overlay and menu sit under the bar so the X stays tappable, and below
	   modals / onboarding (50) and toasts (60). */
	.mobile-nav__overlay {
		position: fixed;
		inset: 0;
		z-index: 38;
		padding: 0;
		border: none;
		background: rgba(19, 25, 39, 0.35);
		cursor: default;
	}

	.mobile-nav__menu {
		position: fixed;
		top: calc(var(--mobile-nav-height) + env(safe-area-inset-top) + 1.5px);
		left: 0;
		right: 0;
		z-index: 39;
		max-height: calc(100dvh - var(--mobile-nav-height) - env(safe-area-inset-top));
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 8px 0 calc(12px + env(safe-area-inset-bottom));
		border-radius: 0 0 16px 16px;
		background: #fff;
		box-shadow: 0 12px 24px rgba(19, 25, 39, 0.12);
	}

	.mobile-nav__links,
	.mobile-nav__account {
		display: flex;
		flex-direction: column;
	}

	.mobile-nav__account {
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1.5px solid #f5f6f8;
	}

	.mobile-nav__link {
		display: flex;
		align-items: center;
		min-height: 48px;
		padding: 0 20px;
		border: none;
		background: none;
		color: #131927;
		font-family: inherit;
		font-size: 16px;
		font-weight: 400;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}

	.mobile-nav__link:active {
		background: var(--mfsn-primary-tint, #f0f5ec);
	}

	.mobile-nav__link--active {
		font-weight: 700;
		box-shadow: inset 3px 0 0 var(--mfsn-primary, #587244);
	}

	.mobile-nav__link--danger {
		color: #b42318;
	}

	.mobile-nav__link:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.mobile-nav__profile {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 20px;
	}

	.mobile-nav__avatar {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-position: center;
		background-size: cover;
	}

	.mobile-nav__avatar--initial {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--mfsn-primary-tint, rgba(88, 114, 68, 0.08));
		color: var(--mfsn-primary, #587244);
		font-size: 18px;
		font-weight: 500;
	}

	.mobile-nav__profile-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.mobile-nav__profile-name {
		overflow: hidden;
		color: #131927;
		font-size: 16px;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mobile-nav__profile-role {
		color: #696c78;
		font-size: 14px;
	}
</style>
