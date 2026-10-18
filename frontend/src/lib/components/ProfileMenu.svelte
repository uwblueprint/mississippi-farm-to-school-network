<script lang="ts">
	import { goto } from '$app/navigation';
	import { logout } from '$lib/auth';
	import { clearProfile } from '$lib/state/profile.svelte';

	interface Props {
		/** Signed-in user's display name. */
		name: string;
		/** Human-readable role (Farmer, Admin). */
		role: string;
		/** Settings page that "View profile" opens. */
		profileHref: string;
		/** Headshot URL; omitted -> initial-letter avatar. */
		avatarUrl?: string;
	}

	let { name, role, profileHref, avatarUrl }: Props = $props();

	let open = $state(false);
	let loggingOut = $state(false);
	let root: HTMLDivElement;

	function close() {
		open = false;
	}

	function handleWindowClick(event: MouseEvent) {
		if (open && !root.contains(event.target as Node)) close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') close();
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
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<div class="profile-menu" bind:this={root}>
	{#if open}
		<div class="profile-menu__popover" role="menu" aria-label="Account">
			<a href={profileHref} class="profile-menu__item" role="menuitem" onclick={close}>
				View profile
			</a>
			<button
				type="button"
				class="profile-menu__item profile-menu__item--danger"
				role="menuitem"
				disabled={loggingOut}
				onclick={handleLogout}
			>
				{loggingOut ? 'Logging out…' : 'Log out'}
			</button>
		</div>
	{/if}

	<button
		type="button"
		class="profile-menu__trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		{#if avatarUrl}
			<span class="profile-menu__avatar" style="background-image: url('{avatarUrl}')"></span>
		{:else}
			<span class="profile-menu__avatar profile-menu__avatar--initial" aria-hidden="true">
				{name.charAt(0).toUpperCase()}
			</span>
		{/if}
		<span class="profile-menu__text">
			<span class="profile-menu__name">{name}</span>
			<span class="profile-menu__role">{role}</span>
		</span>
	</button>
</div>

<style>
	.profile-menu {
		position: relative;
		align-self: stretch;
	}

	.profile-menu__trigger {
		display: flex;
		align-items: center;
		gap: 16px;
		width: 100%;
		padding: 6px;
		margin: -6px;
		box-sizing: content-box;
		border: none;
		border-radius: 8px;
		background: transparent;
		text-align: left;
		cursor: pointer;
	}

	.profile-menu__trigger:hover,
	.profile-menu__trigger[aria-expanded='true'] {
		background: #f5f6f8; /* --Neutral-200 */
	}

	.profile-menu__trigger:focus-visible {
		outline: 2px solid var(--mfsn-primary, #587244);
		outline-offset: 2px;
	}

	.profile-menu__avatar {
		width: 40px;
		height: 40px;
		flex: none;
		border-radius: 40px;
		background-color: lightgray;
		background-position: 50%;
		background-size: cover;
		background-repeat: no-repeat;
	}

	.profile-menu__avatar--initial {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--mfsn-primary-tint, rgba(88, 114, 68, 0.08));
		color: var(--mfsn-primary, #587244);
		font-size: 18px;
		font-weight: 500;
	}

	.profile-menu__text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.profile-menu__name,
	.profile-menu__role {
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-style: normal;
		font-weight: 400;
		line-height: normal;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.profile-menu__name {
		color: #131927; /* --text-icon-primary */
		font-size: 14px;
	}

	.profile-menu__role {
		color: #939393;
		font-size: 12px;
	}

	.profile-menu__popover {
		position: absolute;
		bottom: calc(100% + 12px);
		left: -6px;
		right: -6px;
		z-index: 70;
		display: flex;
		flex-direction: column;
		padding: 6px;
		border: 1.5px solid #f5f6f8;
		border-radius: 8px;
		background: #fff;
		box-shadow: 0 8px 24px rgba(19, 25, 39, 0.12);
	}

	.profile-menu__item {
		display: block;
		width: 100%;
		padding: 10px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: #131927;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 14px;
		font-weight: 400;
		line-height: normal;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		box-sizing: border-box;
	}

	.profile-menu__item:hover:not(:disabled) {
		background: #f5f6f8;
	}

	.profile-menu__item--danger {
		color: #c4341f;
	}

	.profile-menu__item:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>
