<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		value?: string;
		type?: HTMLInputElement['type'];
		name?: string;
		id?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		errorCTA?: Snippet;
		[name: string]: unknown;
	}

	let {
		label,
		value = $bindable(''),
		type = 'text',
		name,
		id,
		autocomplete,
		placeholder,
		required = false,
		disabled = false,
		error,
		errorCTA,
		...rest
	}: Props = $props();

	const inputId = $derived(id ?? (name ? `${name}-input` : undefined));
	const errorId = $derived(name ? `${name}-error` : undefined);
</script>

<label class="field">
	<span class="label">{label}</span>
	<input
		class="input"
		class:input--error={!!error}
		{type}
		{name}
		id={inputId}
		{autocomplete}
		{placeholder}
		{required}
		{disabled}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error && errorId ? errorId : undefined}
		{...rest}
	/>
	{#if error}
		<p class="error" id={errorId} role="alert">
			<svg class="error-icon" viewBox="0 0 16 16" aria-hidden="true">
				<circle cx="8" cy="8" r="7" fill="currentColor" />
				<path
					d="M8 4.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 6.25a.875.875 0 1 0 0 1.75.875.875 0 0 0 0-1.75z"
					fill="#ffffff"
				/>
			</svg>
			<span class="error-content">
				<span>{error}</span>
				{#if errorCTA}
					<span class="error-cta">
						{@render errorCTA()}
					</span>
				{/if}
			</span>
		</p>
	{/if}
</label>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-input-border);
		border-radius: 0.5rem;
		background-color: #ffffff;
		color: #000000;
		font-size: 1rem;
		font-family: inherit;
	}

	.input::placeholder {
		color: #9ca3af;
	}

	.input:focus {
		outline: 2px solid #000000;
		outline-offset: 1px;
	}

	.input--error {
		border-color: #f4a4a4;
	}

	.input--error:focus {
		outline-color: #f4a4a4;
	}

	.error {
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-error);
	}

	.error-icon {
		flex-shrink: 0;
		width: 0.875rem;
		height: 0.875rem;
		margin-top: 0.125rem;
	}

	.error-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
</style>
