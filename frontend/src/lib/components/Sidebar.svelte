<script lang="ts">
	import { page } from '$app/state';
	import logoDefault from '$lib/assets/favicon.svg';

	interface Props {
		/** Logo image source; defaults to the app favicon (watermelon mark). */
		logoSrc?: string;
		/** Signed-in user's name shown in the bottom profile block. */
		profileName?: string;
		/** Signed-in user's role (Farmer, Admin, …). */
		profileRole?: string;
		/** Signed-in user's headshot URL; omitted -> initial-letter avatar. */
		avatarUrl?: string;
		/** Farms owned by the signed-in user; null while loading or on failure. */
		farmCount?: number | null;
		/** Sends the password-reset email. Rejects to surface an error in the menu. */
		onResetPassword?: () => void | Promise<void>;
		/** Signs the user out and navigates away. */
		onLogout?: () => void | Promise<void>;
	}

	let {
		logoSrc = logoDefault,
		profileName = 'Farmer',
		profileRole = 'Farmer',
		avatarUrl,
		farmCount = null,
		onResetPassword,
		onLogout
	}: Props = $props();

	// TODO(routes): add a "Contact MSFN" item once a contact page exists.
	const navItems = [
		{ label: 'Farms', href: '/farmer/farms' },
		{ label: 'Map', href: '/farms' }
	];

	const path = $derived(page.url.pathname);
	const isActive = (href: string) => path === href || path.startsWith(href + '/');

	let menuOpen = $state(false);
	let busy = $state(false);
	let statusMessage = $state('');
	let profileWrap = $state<HTMLDivElement | null>(null);

	const farmCountLabel = $derived(
		farmCount === null ? null : `${farmCount} ${farmCount === 1 ? 'farm' : 'farms'}`
	);

	function toggleMenu() {
		menuOpen = !menuOpen;
		if (!menuOpen) statusMessage = '';
	}

	function closeMenu() {
		menuOpen = false;
		statusMessage = '';
	}

	// Clicks anywhere outside the profile block dismiss the menu.
	function handleWindowClick(event: MouseEvent) {
		if (!menuOpen || !profileWrap) return;
		if (!profileWrap.contains(event.target as Node)) closeMenu();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && menuOpen) closeMenu();
	}

	async function handleResetPassword() {
		if (!onResetPassword || busy) return;
		busy = true;
		statusMessage = '';
		try {
			await onResetPassword();
			statusMessage = 'Password reset email sent.';
		} catch {
			statusMessage = 'Could not send the reset email. Try again.';
		} finally {
			busy = false;
		}
	}

	async function handleLogout() {
		if (!onLogout || busy) return;
		busy = true;
		try {
			await onLogout();
		} catch {
			statusMessage = 'Could not log out. Try again.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<aside class="sidebar">
	<div class="sidebar__top">
		<div class="sidebar__logo">
			<img src={logoSrc} alt="Mississippi Farm to School Network" />
		</div>

		<hr class="sidebar__divider" />

		<nav class="sidebar__nav">
			{#each navItems as item (item.href)}
				<a href={item.href} class="sidebar__link" class:sidebar__link--active={isActive(item.href)}>
					{item.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="sidebar__bottom">
		<hr class="sidebar__divider" />

		<div class="sidebar__profile-wrap" bind:this={profileWrap}>
			{#if menuOpen}
				<div class="sidebar__menu" role="menu" aria-label="Account">
					<div class="sidebar__menu-header">
						<span class="sidebar__menu-email" title={profileName}>{profileName}</span>
						<span class="sidebar__menu-meta">
							{profileRole}{farmCountLabel ? ` · ${farmCountLabel}` : ''}
						</span>
					</div>

					<hr class="sidebar__menu-divider" />

					<button
						type="button"
						class="sidebar__menu-item"
						role="menuitem"
						disabled={busy}
						onclick={handleResetPassword}
					>
						Reset password
					</button>
					<button
						type="button"
						class="sidebar__menu-item"
						role="menuitem"
						disabled={busy}
						onclick={handleLogout}
					>
						Log out
					</button>

					{#if statusMessage}
						<p class="sidebar__menu-status" role="status">{statusMessage}</p>
					{/if}
				</div>
			{/if}

			<button
				type="button"
				class="sidebar__profile"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				onclick={toggleMenu}
			>
				{#if avatarUrl}
					<div
						class="sidebar__avatar"
						role="img"
						aria-label={profileName}
						style="background-image: url('{avatarUrl}')"
					></div>
				{:else}
					<div class="sidebar__avatar sidebar__avatar--initial" role="img" aria-label={profileName}>
						{profileName.charAt(0).toUpperCase()}
					</div>
				{/if}
				<div class="sidebar__profile-text">
					<span class="sidebar__profile-name" title={profileName}>{profileName}</span>
					<span class="sidebar__profile-role">{profileRole}</span>
				</div>
			</button>
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

	/* anchors the popover above the profile row */
	.sidebar__profile-wrap {
		position: relative;
		align-self: stretch;
		min-width: 0;
	}

	.sidebar__profile {
		display: flex;
		align-items: center;
		width: 100%;
		min-width: 0;
		gap: 16px;
		padding: 4px;
		margin: -4px;
		border: none;
		border-radius: 8px;
		background: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.sidebar__profile:hover,
	.sidebar__profile[aria-expanded='true'] {
		background: #f5f6f8; /* --Neutral-200 */
	}

	.sidebar__avatar--initial {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--mfsn-primary-tint, rgba(88, 114, 68, 0.08));
		color: var(--mfsn-primary, #587244);
		font-size: 18px;
		font-weight: 500;
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
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: #131927; /* --text-icon-primary */
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 14px;
		font-style: normal;
		font-weight: 400;
		line-height: normal;
	}

	.sidebar__profile-role {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: #939393;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 12px;
		font-style: normal;
		font-weight: 400;
		line-height: normal;
	}

	.sidebar__menu {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 0;
		right: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		padding: 12px;
		gap: 4px;
		border: 1.5px solid #f5f6f8; /* --Neutral-200 */
		border-radius: 8px;
		background: #fff;
		box-shadow: 0 8px 24px rgba(19, 25, 39, 0.12);
	}

	.sidebar__menu-header {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		padding: 2px 6px;
	}

	.sidebar__menu-email {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: #131927;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 13px;
		font-weight: 500;
	}

	.sidebar__menu-meta {
		color: #939393;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 12px;
	}

	.sidebar__menu-divider {
		height: 0;
		margin: 6px 0;
		border: none;
		border-top: 1.5px solid #f5f6f8;
	}

	.sidebar__menu-item {
		padding: 8px 6px;
		border: none;
		border-radius: 6px;
		background: none;
		color: #131927;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 14px;
		text-align: left;
		cursor: pointer;
	}

	.sidebar__menu-item:hover:not(:disabled) {
		background: #f5f6f8;
	}

	.sidebar__menu-item:disabled {
		color: #9a9fa9;
		cursor: not-allowed;
	}

	.sidebar__menu-status {
		margin: 4px 6px 0;
		color: #587244;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 12px;
		line-height: 1.35;
	}
</style>
