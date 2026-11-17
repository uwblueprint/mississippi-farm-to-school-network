<script lang="ts" module>
	import type { MobileNavItem } from '$lib/components/MobileNavMenu.svelte';

	/** Shared with the phone dropdown menu. */
	export const FARMER_NAV_ITEMS: MobileNavItem[] = [
		{ label: 'Farms', href: '/farmer/farms' },
		{ label: 'Map', href: '/farms' },
		{
			label: 'Contact MFSN',
			href: 'https://www.mississippifarmtoschool.org/contact',
			external: true
		}
	];
</script>

<script lang="ts">
	import { page } from '$app/state';
	import logoDefault from '$lib/assets/favicon.svg';
	import ProfileMenu from '$lib/components/ProfileMenu.svelte';

	interface Props {
		/** Logo image source; defaults to the app favicon (watermelon mark). */
		logoSrc?: string;
		/** Signed-in user's name shown in the bottom profile block. */
		profileName?: string;
		/** Signed-in user's role (Farmer, Admin, …). */
		profileRole?: string;
		/** Signed-in user's headshot URL; omitted -> initial-letter avatar. */
		avatarUrl?: string;
		/** Page the profile menu's "View profile" opens. */
		profileHref?: string;
	}

	let {
		logoSrc = logoDefault,
		profileName = 'Farmer',
		profileRole = 'Farmer',
		avatarUrl,
		profileHref = '/farmer/settings'
	}: Props = $props();

	const navItems = FARMER_NAV_ITEMS.filter((item) => !item.external);
	const contactItem = FARMER_NAV_ITEMS.find((item) => item.external);

	const path = $derived(page.url.pathname);
	const isActive = (href: string) => path === href || path.startsWith(href + '/');
</script>

<aside class="sidebar">
	<div class="sidebar__top">
		<div class="sidebar__logo">
			<img src={logoSrc} alt="Mississippi Farm to School Network" />
		</div>

		<hr class="sidebar__divider" />

		<nav class="sidebar__nav">
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					class="sidebar__link"
					class:sidebar__link--active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					{item.label}
				</a>
			{/each}
			{#if contactItem}
				<a href={contactItem.href} class="sidebar__link" target="_blank" rel="noopener noreferrer">
					{contactItem.label}
				</a>
			{/if}
		</nav>
	</div>

	<div class="sidebar__bottom">
		<hr class="sidebar__divider" />
		<div data-onboarding="profile">
			<ProfileMenu name={profileName} role={profileRole} {profileHref} {avatarUrl} />
		</div>
	</div>
</aside>

<style>
	.sidebar {
		position: sticky;
		top: 0;
		display: inline-flex;
		width: 250px;
		height: 100vh; /* fills viewport so it stays anchored while main content scrolls */
		padding: 20px 25px;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		border-radius: 8px;
		border-right: 2px solid #f5f6f8; /* --Neutral-200 */
		background: #fff;
		box-sizing: border-box;
	}

	/* groups anchored to the top and bottom (justify-content: space-between) */
	.sidebar__top,
	.sidebar__bottom {
		display: flex;
		flex-direction: column;
		align-self: stretch;
		gap: 16px;
		min-width: 0;
	}

	.sidebar__logo img {
		display: block;
		width: 50px;
		height: 50px;
		aspect-ratio: 1 / 1;
		object-fit: contain;
	}

	.sidebar__divider {
		align-self: stretch;
		height: 0;
		margin: 0;
		border: none;
		border-top: 1.5px solid #f5f6f8; /* --Neutral-200 */
	}

	.sidebar__nav {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.sidebar__link {
		display: flex;
		align-items: center;
		align-self: stretch;
		height: 31px;
		color: #131927; /* --text-icon-primary */
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 16px;
		font-style: normal;
		font-weight: 400;
		line-height: normal;
		text-decoration: none;
	}

	.sidebar__link--active {
		font-weight: 700;
	}
</style>
