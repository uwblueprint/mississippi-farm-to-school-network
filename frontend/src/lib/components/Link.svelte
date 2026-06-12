<script lang="ts">
	interface Props {
		href: string;
		label: string;
		variant?: 'default' | 'small';
		[name: string]: unknown;
	}

	let { href, label, variant = 'default', ...rest }: Props = $props();
</script>

<a {href} class="mfsn-link" class:mfsn-link--small={variant === 'small'} {...rest}>
	{label}
</a>

<style>
	.mfsn-link {
		font-weight: 700;
		color: var(--color-link);
		text-decoration: none;
	}

	.mfsn-link:hover {
		color: color-mix(in srgb, var(--color-link) 88%, black);
	}

	.mfsn-link--small {
		display: inline-block;
		margin-top: 0.5rem;
		font-size: 0.875rem;
	}
</style>
