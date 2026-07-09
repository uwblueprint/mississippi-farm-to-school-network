<script lang="ts">
	interface Props {
		label: string;
		value?: string;
		placeholder?: string;
		optional?: boolean;
		readonly?: boolean;
		multiline?: boolean;
	}

	let {
		label,
		value = $bindable(''),
		placeholder = '',
		optional = false,
		readonly = false,
		multiline = false
	}: Props = $props();
</script>

{#if readonly}
	<div class="field">
		<span class="field__label field__label--strong">{label}</span>
		<span class="field__readonly">{value}</span>
	</div>
{:else}
	<label class="field">
		<span class="field__label" class:field__label--optional={optional}>{label}</span>
		{#if multiline}
			<textarea class="field__input field__textarea" rows="4" bind:value></textarea>
		{:else}
			<input class="field__input" {placeholder} bind:value />
		{/if}
	</label>
{/if}

<style>
	.field {
		display: flex;
		flex-direction: column;
		/* label ↔ input */
		gap: 14px;
	}

	.field__label {
		font-size: 21px;
		font-weight: 300;
		color: #131927;
	}

	.field__label--optional {
		color: #000;
	}

	/* Farm ID# — heavier than the light field labels */
	.field__label--strong {
		font-weight: 400;
	}

	.field__input {
		padding: 16.8px 22.4px;
		border-radius: 11.2px;
		border: 1.82px solid #d3d5de; /* --Neutral-300 */
		background: #fff; /* --Neutral-0 */
		font-size: 17.343px;
		font-family: 'Nunito Variable', 'Nunito', 'DM Sans Variable', sans-serif;
		font-weight: 400;
		line-height: normal;
		color: #383b4a; /* --Neutral-600 */
		box-sizing: border-box;
	}

	.field__textarea {
		resize: vertical;
	}

	.field__readonly {
		color: #383b4a; /* --Neutral-600 */
		font-family: 'Nunito Variable', 'Nunito', sans-serif;
		font-size: 17.343px;
		font-weight: 400;
		line-height: normal;
	}
</style>
