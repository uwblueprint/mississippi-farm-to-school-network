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
		showPasswordToggle?: boolean;
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
		showPasswordToggle = false,
		...rest
	}: Props = $props();

	const inputId = $derived(id ?? (name ? `${name}-input` : undefined));
	const errorId = $derived(name ? `${name}-error` : undefined);
	const isPasswordField = $derived(type === 'password');
	let showPassword = $state(false);
	const inputType = $derived(
		showPasswordToggle && isPasswordField ? (showPassword ? 'text' : 'password') : type
	);
</script>

<label class="field">
	<span class="label">{label}</span>
	{#if showPasswordToggle && isPasswordField}
		<div class="input-wrapper">
			<input
				class="input--with-toggle input"
				class:input--error={!!error}
				type={inputType}
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
			<button
				type="button"
				class="toggle-button"
				aria-label={showPassword ? 'Hide password' : 'Show password'}
				aria-pressed={showPassword}
				onclick={() => (showPassword = !showPassword)}
			>
				<img
					class="toggle-icon"
					src={showPassword ? '/images/auth/eye-off.svg' : '/images/auth/eye.svg'}
					alt=""
					width="21"
					height="21"
				/>
			</button>
		</div>
	{:else}
		<input
			class="input"
			class:input--error={!!error}
			type={inputType}
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
	{/if}
	{#if error}
		<p class="error" id={errorId} role="alert">
			<img class="error-icon" src="/images/auth/error.svg" alt="" width="15" height="15" />
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
		gap: 0.875rem; /* 14px */
	}

	.label {
		font-family: 'DM Sans', sans-serif;
		font-size: 1.09rem; /* ~17.44px */
		font-weight: 400;
		line-height: normal;
		color: #000000;
	}

	.input {
		width: 100%;
		padding: 0.87375rem 1.165rem; /* ~14px 18.64px */
		border: 1.5px solid #d3d5de;
		border-radius: 0.5rem; /* 8px */
		background-color: #ffffff;
		color: #131927;
		font-family: 'DM Sans', sans-serif;
		font-size: 1.019375rem; /* ~16.31px */
		line-height: 1.165rem; /* ~18.64px */
	}

	.input::placeholder {
		color: #9ca3af;
	}

	.input:focus {
		outline: 2px solid #000000;
		outline-offset: 1px;
	}

	.input:disabled {
		background-color: #f5f6f8;
		color: #9a9fa9;
		cursor: not-allowed;
	}

	.input--error {
		border-color: #f4a4a4;
	}

	.input--error:focus {
		outline-color: #f4a4a4;
	}

	.input-wrapper {
		position: relative;
		width: 100%;
	}

	.input--with-toggle {
		padding-right: 3rem;
	}

	.toggle-button {
		position: absolute;
		top: 50%;
		right: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background: none;
		color: #4f545e;
		cursor: pointer;
		transform: translateY(-50%);
	}

	.toggle-button:hover {
		color: #131927;
	}

	.toggle-icon {
		width: 1.3125rem; /* 21px */
		height: 1.3125rem;
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
		width: 0.9375rem; /* 15px */
		height: 0.9375rem;
		margin-top: 0.125rem;
	}

	.error-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
</style>
