<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { onAuthStateChanged } from 'firebase/auth';

	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { getDisplayName, resolveUserRole } from '$lib/auth';
	import { getFirebaseAuth } from '$lib/firebase';
	import type { AdminProfile } from '$lib/types/admin';
	import '$lib/styles/admin/admin.css';

	let { children } = $props();

	let isAdmin = $state(false);
	let profile = $state<AdminProfile>({ name: '', email: '', role: 'ADMIN' });

	// The parent (protected) layout already enforces sign-in and email verification; this
	// layout narrows access to admins so farmers cannot reach the dashboard by URL.
	onMount(() => {
		const auth = getFirebaseAuth();

		return onAuthStateChanged(auth, async (user) => {
			if (!user) {
				goto('/login');
				return;
			}

			const role = await resolveUserRole(user);
			if (role !== 'ADMIN') {
				goto('/farmer');
				return;
			}

			profile = { name: getDisplayName(user), email: user.email ?? '', role };
			isAdmin = true;
		});
	});
</script>

{#if isAdmin}
	<div class="admin-shell">
		<AdminSidebar {profile} />
		{@render children()}
	</div>
	<ToastHost />
{/if}
