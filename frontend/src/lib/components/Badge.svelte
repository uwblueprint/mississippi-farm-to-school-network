<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		/** Skeleton badge classes: badge, preset-* (e.g. preset-filled-primary-500) */
		class?: string;
		[name: string]: unknown;
	}

	let { children, class: className = 'preset-filled-surface-500', ...rest }: Props = $props();
</script>

<span class="badge {className}" {...rest}>
	{@render children?.()}
</span>
