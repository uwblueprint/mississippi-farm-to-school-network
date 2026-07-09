<script lang="ts">
	interface Props {
		title: string;
		hint: string;
		/**
		 * Optional file-picker wiring. When provided, the zone becomes an
		 * interactive button that opens a hidden <input type="file"> and calls
		 * back with the chosen files. Omit it to keep the original static visual.
		 */
		onFiles?: (files: FileList) => void;
		accept?: string;
		multiple?: boolean;
		disabled?: boolean;
	}

	let {
		title,
		hint,
		onFiles,
		accept = 'image/png,image/jpeg',
		multiple = true,
		disabled = false
	}: Props = $props();

	const interactive = $derived(!!onFiles);

	let input = $state<HTMLInputElement | null>(null);

	function open() {
		if (!disabled) input?.click();
	}

	function handleChange(event: Event) {
		const el = event.currentTarget as HTMLInputElement;
		if (el.files && el.files.length > 0) onFiles?.(el.files);
		// reset so picking the same file again still fires a change event
		el.value = '';
	}
</script>

{#snippet inner()}
	<span class="upload-zone__icon">
		<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none" aria-hidden="true">
			<path d="M30.625 21.875V23.625C30.625 26.0752 30.625 27.3003 30.1482 28.2362C29.7287 29.0594 29.0594 29.7287 28.2362 30.1482C27.3003 30.625 26.0752 30.625 23.625 30.625H11.375C8.92477 30.625 7.69966 30.625 6.76379 30.1482C5.94058 29.7287 5.27129 29.0594 4.85185 28.2362C4.375 27.3003 4.375 26.0752 4.375 23.625V21.875M10.2083 11.6667L17.5 4.375L24.7917 11.6667M17.5 4.375V21.875" stroke="black" stroke-width="2.91667" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</span>
	<span class="upload-zone__title">{title}</span>
	<span class="upload-zone__hint">{hint}</span>
{/snippet}

{#if interactive}
	<button type="button" class="upload-zone" onclick={open} {disabled}>
		{@render inner()}
	</button>
	<input
		bind:this={input}
		class="upload-zone__file"
		type="file"
		{accept}
		{multiple}
		onchange={handleChange}
	/>
{:else}
	<div class="upload-zone">
		{@render inner()}
	</div>
{/if}

<style>
	.upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 49px 24px 29px;
		border: 1px dashed #c5c8d8;
		border-radius: 12px;
		text-align: center;
	}

	/* When rendered as a button, strip native chrome and keep the div visual. */
	button.upload-zone {
		width: 100%;
		background: transparent;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}

	button.upload-zone:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.upload-zone__file {
		display: none;
	}

	.upload-zone__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 65px;
		height: 65px;
		flex-shrink: 0;
		border-radius: 32.5px;
		border: 1px solid #d6d6d6;
		background: #fff;
	}

	.upload-zone__icon svg {
		width: 35px;
		height: 35px;
		flex-shrink: 0;
	}

	.upload-zone__title {
		color: #000;
		text-align: center;
		font-family: 'Figtree Variable', 'Figtree', sans-serif;
		font-size: 22.711px;
		font-weight: 500;
		line-height: 38.933px;
	}

	.upload-zone__hint {
		color: #000;
		text-align: center;
		font-size: 14px;
		font-weight: 400;
		line-height: 16px;
		align-self: stretch;
	}
</style>
