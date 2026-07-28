<script lang="ts">
	/**
	 * A labelled group of checkboxes binding a string[] of the selected options.
	 */
	interface Props {
		label: string;
		options: string[];
		value: string[];
		/** An option (e.g. "None of the above") that is mutually exclusive with
		 *  the rest: checking it clears the others, and checking any other
		 *  option clears it. */
		exclusive?: string;
	}

	let { label, options, value = $bindable(), exclusive }: Props = $props();

	function toggle(option: string) {
		if (value.includes(option)) {
			value = value.filter((o) => o !== option);
		} else if (option === exclusive) {
			value = [option];
		} else {
			value = [...value.filter((o) => o !== exclusive), option];
		}
	}
</script>

<fieldset class="choice-group">
	<legend class="choice-group__label">{label}</legend>
	{#each options as option (option)}
		<label class="choice">
			<input type="checkbox" checked={value.includes(option)} onchange={() => toggle(option)} />
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
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Crect x='0.75' y='0.75' width='22.5' height='22.5' rx='1.25' stroke='%239EA0AD' stroke-width='1.5'/%3E%3C/svg%3E");
	}

	.choice input:checked {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Crect x='0.75' y='0.75' width='22.5' height='22.5' rx='1.25' fill='%23131927' stroke='%23131927' stroke-width='1.5'/%3E%3Cpath d='M6.5 12.5L10.5 16.5L17.5 8.5' stroke='white' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
	}
</style>
