<script lang="ts">
	import { page } from '$app/stores';
	import logoDefault from '$lib/assets/favicon.svg';

	interface Props {
		/** Logo image source; defaults to the app favicon (watermelon mark). */
		logoSrc?: string;
		/** Signed-in user's name shown in the bottom profile block. */
		profileName?: string;
		/** Signed-in user's role (Farmer, Admin, …). */
		profileRole?: string;
		/** Signed-in user's headshot URL. */
		avatarUrl?: string;
	}

	let {
		logoSrc = logoDefault,
		profileName = 'Farmer Name',
		profileRole = 'Farmer',
		avatarUrl = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'
	}: Props = $props();

	const navItems = [
		{ label: 'Farms', href: '/farmer/farms' },
		{ label: 'Map', href: '/map' },
		{ label: 'Contact MSFN', href: '/contact' }
	];

	const path = $derived($page.url.pathname);
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
					class="sidebar__link {isActive(item.href) ? 'sidebar__link--active' : ''}"
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="sidebar__bottom">
		<hr class="sidebar__divider" />
		<div class="sidebar__profile">
			<div
				class="sidebar__avatar"
				role="img"
				aria-label={profileName}
				style="background-image: url('{avatarUrl}')"
			></div>
			<div class="sidebar__profile-text">
				<span class="sidebar__profile-name">{profileName}</span>
				<span class="sidebar__profile-role">{profileRole}</span>
			</div>
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

	.sidebar__profile {
		display: flex;
		align-items: center;
		align-self: stretch;
		gap: 16px;
	}

	.sidebar__avatar {
		width: 40px;
		height: 40px;
		aspect-ratio: 1 / 1;
		flex: none;
		border-radius: 40px;
		background-color: lightgray;
		background-position: 50%;
		background-size: cover;
		background-repeat: no-repeat;
	}

	.sidebar__profile-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.sidebar__profile-name {
		color: #131927; /* --text-icon-primary */
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 14px;
		font-style: normal;
		font-weight: 400;
		line-height: normal;
	}

	.sidebar__profile-role {
		color: #939393;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 12px;
		font-style: normal;
		font-weight: 400;
		line-height: normal;
	}
</style>
