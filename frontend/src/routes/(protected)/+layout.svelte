<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getFirebaseAuth } from '$lib/firebase';
	import { onAuthStateChanged } from 'firebase/auth';

	let { children } = $props();
	let isAuthenticated = $state(false);

	onMount(() => {
		const auth = getFirebaseAuth();

		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				goto('/');
			} else {
				isAuthenticated = true;
			}
		});

		return unsubscribe;
	});
</script>

{#if isAuthenticated}
	{@render children()}
{/if}
