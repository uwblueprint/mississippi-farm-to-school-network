<script lang="ts">
	import type { Snippet } from 'svelte';
	import '$lib/styles/auth/auth-shell.css';
	import BrandHeader from '$lib/components/BrandHeader.svelte';

	interface Props {
		children: Snippet;
		actions?: Snippet;
	}

	let { children, actions }: Props = $props();
</script>

<div class="auth-shell">
	<div class="auth-shell__container">
		<BrandHeader />

		<div class="auth-shell__body">
			{@render children()}
		</div>

		{#if actions}
			<div class="auth-shell__actions">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>
