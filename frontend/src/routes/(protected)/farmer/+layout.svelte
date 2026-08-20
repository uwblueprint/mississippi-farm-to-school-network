<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { getFirebaseAuth } from '$lib/firebase';
	import { gqlClient } from '$lib/graphqlClient';
	import { logout, sendPasswordResetEmailHandler } from '$lib/auth';

	let { children } = $props();

	const MY_FARMS_COUNT = `
		query MyFarmsCount {
			myFarms {
				id
			}
		}
	`;

	// The (protected) gate guarantees a signed-in user by the time this renders;
	// surface their identity in the sidebar profile block.
	let profileName = $state('Farmer');
	let profileEmail = $state('');
	// null keeps the count out of the menu when it is unknown, rather than showing 0.
	let farmCount = $state<number | null>(null);

	onMount(() => {
		const user = getFirebaseAuth().currentUser;
		profileName = user?.displayName || user?.email || 'Farmer';
		profileEmail = user?.email ?? '';

		void (async () => {
			try {
				const { myFarms } = await gqlClient<{ myFarms: { id: string }[] }>(MY_FARMS_COUNT);
				farmCount = myFarms.length;
			} catch {
				farmCount = null;
			}
		})();
	});

	async function handleResetPassword() {
		if (!profileEmail) {
			throw new Error('No email on the signed-in account.');
		}
		await sendPasswordResetEmailHandler(profileEmail);
	}

	async function handleLogout() {
		await logout();
		await goto('/');
	}
</script>

<div class="dashboard">
	<Sidebar
		{profileName}
		{farmCount}
		onResetPassword={handleResetPassword}
		onLogout={handleLogout}
	/>
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
