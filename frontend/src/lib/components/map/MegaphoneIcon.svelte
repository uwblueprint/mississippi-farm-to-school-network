<script lang="ts">
	let { size = 20 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d="m3 11 18-5v12L3 14v-3z" />
	<path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
</svg>
