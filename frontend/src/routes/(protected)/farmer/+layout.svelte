<script lang="ts">
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { getFirebaseAuth } from '$lib/firebase';

	let { children } = $props();

	// The (protected) gate guarantees a signed-in user by the time this renders;
	// surface their identity in the sidebar profile block.
	let profileName = $state('Farmer');
	onMount(() => {
		const user = getFirebaseAuth().currentUser;
		profileName = user?.displayName || user?.email || 'Farmer';
	});
</script>

<div class="dashboard">
	<Sidebar {profileName} />
	<main class="dashboard__main">
		{@render children()}
	</main>
</div>

<style>
	.dashboard {
		display: flex;
		align-items: flex-start;
		min-height: 100vh;
		/* The farmer pages are designed on white; the global body background is
		   #f5f5f5 (from main's flows), so paint this subtree explicitly. */
		background: var(--mfsn-surface, #ffffff);
	}

	.dashboard__main {
		flex: 1;
		min-width: 0;
		/* establishes the sizing context for the cqi-based fluid spacing inside */
		container-type: inline-size;
	}
</style>
