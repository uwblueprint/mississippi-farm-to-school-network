<script lang="ts">
	import { MARKER_META, MARKER_TYPE_ORDER } from '$lib/constants/markers';

	const LEGEND_ITEMS = MARKER_TYPE_ORDER.map((type) => ({ type, ...MARKER_META[type] }));

	let open = $state(false);
</script>

<div
	class="farm-map-legend"
	role="group"
	onmouseenter={() => (open = true)}
	onmouseleave={() => (open = false)}
>
	<button
		type="button"
		class="farm-map-legend__trigger"
		aria-label="Show map legend"
		aria-expanded={open}
		onfocus={() => (open = true)}
		onblur={() => (open = false)}
		onclick={() => (open = !open)}
	>
		i
	</button>

	{#if open}
		<div class="farm-map-legend__popup" role="tooltip">
			<p class="farm-map-legend__title">Location Types</p>
			<ul class="farm-map-legend__list">
				{#each LEGEND_ITEMS as item (item.type)}
					<li class="farm-map-legend__item">
						<img class="farm-map-legend__marker" src={item.icon} alt="" aria-hidden="true" />
						<span class="farm-map-legend__label">{item.label}</span>
					</li>
				{/each}
			</ul>
			<p class="farm-map-legend__footer">
				For more information, visit
				<a
					class="farm-map-legend__link"
					href="https://www.mississippifarmtoschool.org/ms-farm-fresh-map"
					target="_blank"
					rel="noopener noreferrer"
				>
					Mississippi Farm to School Network
				</a>
			</p>
		</div>
	{/if}
</div>
