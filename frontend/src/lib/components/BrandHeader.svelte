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
	<p class="title">{title}</p>
</div>

<style>
	.brand-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		width: max-content;
		max-width: 100%;
		align-self: center;
		text-align: center;
	}

	.logo {
		width: 5.5rem;
		height: 5.5rem;
	}

	.title {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 400;
		color: #000000;
	}
</style>
