<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		adminName: string;
	}

	let { adminName }: Props = $props();

	const NAV_ITEMS = [
		{ href: '/admin', label: 'Pending Requests' },
		{ href: '/admin/archived', label: 'Archived farms and Pending Farms' },
		{ href: '/admin/farms', label: 'Farms' },
		{ href: '/admin/accounts', label: 'Accounts' },
		{ href: '/admin/announcements', label: 'Manage Annoucements' }
	];

	function isCurrent(href: string): boolean {
		return href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
	}
</script>

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
		<div>
			<p class="admin-sidebar__user-name">{adminName}</p>
			<p class="admin-sidebar__user-role">Admin</p>
		</div>
	</div>
</aside>
