<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		/** Skeleton preset classes, e.g. preset-outlined-surface-200-800, preset-filled-primary-500 */
		class?: string;
	}

	let { children, class: className = 'preset-outlined-surface-200-800', ...rest }: Props = $props();
</script>

<div class="card {className}" {...rest}>
	{@render children?.()}
</div>
