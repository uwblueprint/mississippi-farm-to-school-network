<script lang="ts">
	const FILTER_LABELS = ['Distance', 'Institution Type', 'Products', 'Tags'];
</script>

<div class="farm-filter-row" aria-label="Farm filters">
	<span class="farm-filter-row__label">Filters</span>
	<div class="farm-filter-pills">
		{#each FILTER_LABELS as label}
			<button type="button" class="farm-filter-pill" onclick={() => undefined}>
				{label}
				<span class="farm-filter-pill__chevron" aria-hidden="true">›</span>
			</button>
		{/each}
	</div>
</div>
