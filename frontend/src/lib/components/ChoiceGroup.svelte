<script lang="ts">
	/**
	 * Unifies the checkboxGroup and yesNo choice patterns from the farm edit form.
	 *
	 * Renders a labelled group of checkbox or radio inputs. Checkbox groups bind a
	 * string[] of selected options; radio groups bind a single string.
	 */
	interface Props {
		label: string;
		options: string[];
		type?: 'checkbox' | 'radio';
		name?: string;
		value: string[] | string;
	}

	let {
		label,
		options,
		type = 'checkbox',
		name = '',
		value = $bindable()
	}: Props = $props();

	function toggle(option: string) {
		const current = Array.isArray(value) ? value : [];
		value = current.includes(option)
			? current.filter((o) => o !== option)
			: [...current, option];
	}
</script>

<fieldset class="choice-group">
	<legend class="choice-group__label">{label}</legend>
	{#each options as option (option)}
		<label class="choice">
			{#if type === 'checkbox'}
				<input
					type="checkbox"
					checked={Array.isArray(value) && value.includes(option)}
					onchange={() => toggle(option)}
				/>
			{:else}
				<input type="radio" {name} value={option} bind:group={value} />
			{/if}
			<span>{option}</span>
		</label>
	{/each}
</fieldset>

<style>
	.choice-group {
		border: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		/* label-to-label gap */
		gap: 12px;
	}

	.choice-group__label {
		font-size: 21px;
		padding: 0;
		/* title ↔ labels: 2px more than the 12px label-to-label gap */
		margin-bottom: 14px;
	}

	.choice {
		display: flex;
		align-items: center;
		gap: 16px;
		font-size: 21px;
		width: fit-content;
	}

	.choice span {
		color: #000;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 21px;
		font-style: normal;
		font-weight: 300;
		line-height: normal;
	}

	.choice input {
		width: 24px;
		height: 24px;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		flex-shrink: 0;
		appearance: none;
		-webkit-appearance: none;
		border: none;
		background-color: transparent;
		background-repeat: no-repeat;
		background-position: center;
		background-size: 24px 24px;
		cursor: pointer;
	}

	.choice input[type='checkbox'] {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Crect x='0.75' y='0.75' width='22.5' height='22.5' rx='1.25' stroke='%239EA0AD' stroke-width='1.5'/%3E%3C/svg%3E");
	}

	.choice input[type='checkbox']:checked {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Crect x='0.75' y='0.75' width='22.5' height='22.5' rx='1.25' fill='%23131927' stroke='%23131927' stroke-width='1.5'/%3E%3Cpath d='M6.5 12.5L10.5 16.5L17.5 8.5' stroke='white' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
	}

	.choice input[type='radio'] {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='12' r='11.25' stroke='%239EA0AD' stroke-width='1.5'/%3E%3C/svg%3E");
	}

	.choice input[type='radio']:checked {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='12' r='11.25' stroke='%23131927' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='12' r='6' fill='%23131927'/%3E%3C/svg%3E");
	}
</style>
