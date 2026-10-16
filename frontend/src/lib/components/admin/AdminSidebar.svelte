<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import AdminProfileModal from '$lib/components/admin/AdminProfileModal.svelte';
	import { logout } from '$lib/auth';
	import type { AdminProfile } from '$lib/types/admin';

	interface Props {
		profile: AdminProfile;
	}

	let { profile }: Props = $props();

	const NAV_ITEMS = [
		{ href: '/admin', label: 'Pending Requests' },
		{ href: '/admin/farms', label: 'Farms' },
		{ href: '/admin/announcements', label: 'Manage Announcements' },
		{ href: '/admin/archived', label: 'Deleted & Archived Farms' }
	];

	let menuOpen = $state(false);
	let profileOpen = $state(false);
	let loggingOut = $state(false);
	let logoutError = $state<string | null>(null);
	let userRoot = $state<HTMLDivElement | null>(null);

	function isCurrent(href: string): boolean {
		return href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
	}

	function handleWindowClick(event: MouseEvent) {
		if (menuOpen && userRoot && !userRoot.contains(event.target as Node)) menuOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && menuOpen) menuOpen = false;
	}

	function handleViewProfile() {
		menuOpen = false;
		profileOpen = true;
	}

	async function handleLogout() {
		if (loggingOut) return;
		loggingOut = true;
		logoutError = null;

		try {
			await logout();
			await goto('/login');
		} catch {
			logoutError = 'Could not log out. Please try again.';
			loggingOut = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<aside class="admin-sidebar">
	<div class="admin-sidebar__top">
		<img
			class="admin-sidebar__logo"
			src="/images/mfsnLogo.svg"
			alt="Mississippi Farm to School Network's logo"
		/>
		<hr class="admin-sidebar__divider" />
		<nav class="admin-sidebar__nav" aria-label="Admin">
			{#each NAV_ITEMS as item (item.href)}
				<a
					class="admin-sidebar__link"
					href={item.href}
					aria-current={isCurrent(item.href) ? 'page' : undefined}
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="admin-sidebar__bottom">
		<hr class="admin-sidebar__divider" />
		<div class="admin-sidebar__user-wrap" bind:this={userRoot}>
			{#if menuOpen}
				<ul class="admin-sidebar__menu" role="menu" aria-label="Account">
					<li role="presentation">
						<button
							type="button"
							class="farm-request-modal__menu-item"
							role="menuitem"
							onclick={handleViewProfile}
						>
							View profile
						</button>
					</li>
					<li role="presentation">
						<button
							type="button"
							class="farm-request-modal__menu-item farm-request-modal__menu-item--danger"
							role="menuitem"
							disabled={loggingOut}
							onclick={() => void handleLogout()}
						>
							{loggingOut ? 'Logging out…' : 'Log out'}
						</button>
					</li>
				</ul>
			{/if}

			<button
				type="button"
				class="admin-sidebar__user"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span>
					<span class="admin-sidebar__user-name">{profile.name}</span>
					<span class="admin-sidebar__user-role">Admin</span>
				</span>
				<img class="admin-sidebar__user-chevron" src="/images/common/chevronRightIcon.svg" alt="" />
			</button>
		</div>
		{#if logoutError}
			<p class="review-application-card__error">{logoutError}</p>
		{/if}
	</div>
</aside>

{#if profileOpen}
	<AdminProfileModal {profile} onClose={() => (profileOpen = false)} />
{/if}
