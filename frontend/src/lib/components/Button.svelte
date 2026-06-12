<script lang="ts">
	interface Props {
		label: string;
		color?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		fullWidth?: boolean;
		[name: string]: unknown;
	}

	let {
		label,
		color,
		type = 'button',
		disabled = false,
		fullWidth = true,
		...rest
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	class="mfsn-button"
	class:mfsn-button--full-width={fullWidth}
	style:--mfsn-button-color={color}
	{...rest}
>
	{label}
</button>

<style>
	.mfsn-button {
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background-color: var(--mfsn-button-color, var(--color-primary-button));
		color: #ffffff;
		font-size: 1rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
	}

	.mfsn-button--full-width {
		width: 100%;
	}

	.mfsn-button:hover:not(:disabled) {
		background-color: color-mix(
			in srgb,
			var(--mfsn-button-color, var(--color-primary-button)) 88%,
			black
		);
	}

	.mfsn-button:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}
</style>
