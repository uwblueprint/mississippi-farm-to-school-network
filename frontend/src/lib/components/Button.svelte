<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		/** Skeleton button classes: btn, preset-* (e.g. preset-filled-primary-500), optional btn-sm | btn-base | btn-lg */
		class?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		[name: string]: unknown;
	}

	let {
		children,
		class: className = 'preset-filled-primary-500',
		type = 'button',
		...rest
	}: Props = $props();
</script>

<button {type} class="btn {className}" {...rest}>
	{@render children?.()}
</button>
