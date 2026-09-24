<script lang="ts">
	interface Props {
		values: string[];
		tone?: 'green' | 'purple' | 'orange';
		formatLabel?: (value: string) => string;
	}

	let { values, tone = 'green', formatLabel = (v) => v }: Props = $props();

	const visible = $derived(values.filter(Boolean));
	const primary = $derived(visible[0] ? formatLabel(visible[0]) : null);
	const extra = $derived(Math.max(0, visible.length - 1));
</script>

{#if primary}
	<div class="farm-value-pills">
		<span class="farm-value-pills__tag farm-value-pills__tag--{tone}">{primary}</span>
		{#if extra > 0}
			<span class="farm-value-pills__extra">+{extra}</span>
		{/if}
	</div>
{:else}
	<span class="farm-value-pills__empty">—</span>
{/if}
