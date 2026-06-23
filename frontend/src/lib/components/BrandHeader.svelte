<script lang="ts">
	const DEFAULT_TITLE = 'Mississippi Farm to School Network';

	interface Props {
		title?: string;
		logoSrc?: string;
		logoAlt?: string;
	}

	let {
		title = DEFAULT_TITLE,
		logoSrc = '/images/mfsnLogo.svg',
		logoAlt = "Mississippi Farm to School Network's logo"
	}: Props = $props();
</script>

<div class="brand-header">
	<img class="logo" src={logoSrc} alt={logoAlt} />
	{#if title}
		<p class="title">{title}</p>
	{/if}
</div>

<style>
	.brand-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.8125rem; /* 29px */
		width: max-content;
		max-width: 100%;
		align-self: center;
		text-align: center;
	}

	.logo {
		width: 6.25rem; /* 100px */
		height: 6.25rem;
	}

	.title {
		margin: 0;
		font-family: 'Figtree', sans-serif;
		font-size: 2rem; /* 32px */
		font-weight: 500;
		line-height: 2.375rem; /* 38px */
		color: #000000;
	}
</style>
