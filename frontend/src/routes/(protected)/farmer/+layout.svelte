<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import FarmerMobileHeader from '$lib/components/FarmerMobileHeader.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { resolveUserRole } from '$lib/auth';
	import { getFirebaseAuth } from '$lib/firebase';
	import { loadProfile, profile, profileFullName, roleLabel } from '$lib/state/profile.svelte';

	let { children } = $props();

	// The (protected) gate guarantees a signed-in user by the time this renders;
	// surface their identity in the sidebar profile block.
	let fallbackName = $state('Farmer');
	const profileName = $derived(
		profileFullName(profile.current) || profile.current?.email || fallbackName
	);
	const profileRole = $derived(profile.current ? roleLabel(profile.current.role) : 'Farmer');

	onMount(() => {
		const user = getFirebaseAuth().currentUser;
		fallbackName = user?.displayName || user?.email || 'Farmer';
		loadProfile().catch(() => {});

		if (user) {
			resolveUserRole(user)
				.then((role) => {
					if (role === 'ADMIN') goto('/admin', { replaceState: true });
				})
				.catch(() => {});
		}
	});
</script>

<!-- Both navs are always rendered; CSS picks one at the md breakpoint (768px)
     so nothing re-mounts on resize. -->
<FarmerMobileHeader {profileName} {profileRole} />
<div class="dashboard">
	<div class="dashboard__sidebar">
		<Sidebar {profileName} {profileRole} />
	</div>
	<main class="dashboard__main">
		{@render children()}
	</main>
</div>
<ToastHost />

<style>
	.dashboard {
		display: flex;
		align-items: flex-start;
		min-height: 100vh;
		/* The farmer pages are designed on white; the global body background is
		   #f5f5f5 (from main's flows), so paint this subtree explicitly. */
		background: var(--mfsn-surface, #ffffff);
	}

	/* display: contents keeps the sidebar a direct flex child of .dashboard, so
	   its position: sticky behaves exactly as before on desktop. */
	.dashboard__sidebar {
		display: contents;
	}

	.dashboard__main {
		flex: 1;
		min-width: 0;
		/* establishes the sizing context for the cqi-based fluid spacing inside */
		container-type: inline-size;
	}

	/* Below md: hide the persistent sidebar and clear the fixed mobile header
	   (56px, see FarmerMobileHeader). */
	@media (max-width: 767px) {
		.dashboard {
			display: block;
		}

		.dashboard__sidebar {
			display: none;
		}

		.dashboard__main {
			padding-top: calc(56px + env(safe-area-inset-top));
		}
	}
</style>
