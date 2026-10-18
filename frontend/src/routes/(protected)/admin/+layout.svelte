<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { onAuthStateChanged } from 'firebase/auth';

	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { getDisplayName, resolveUserRole } from '$lib/auth';
	import { getFirebaseAuth } from '$lib/firebase';
	import { loadProfile, profile, profileFullName } from '$lib/state/profile.svelte';
	import '$lib/styles/admin/admin.css';

	let { children } = $props();

	let isAdmin = $state(false);
	let fallbackName = $state('');
	const adminName = $derived(profileFullName(profile.current) || fallbackName);

	// The parent (protected) layout already enforces sign-in and email verification; this
	// layout narrows access to admins so farmers cannot reach the dashboard by URL.
	onMount(() => {
		const auth = getFirebaseAuth();

		return onAuthStateChanged(auth, async (user) => {
			if (!user) {
				goto('/login');
				return;
			}

			if ((await resolveUserRole(user)) !== 'ADMIN') {
				goto('/farmer');
				return;
			}

			fallbackName = getDisplayName(user);
			isAdmin = true;
			loadProfile().catch(() => {});
		});
	});
</script>

{#if isAdmin}
	<div class="admin-shell">
		<AdminSidebar {adminName} />
		{@render children()}
	</div>
	<ToastHost />
{/if}
