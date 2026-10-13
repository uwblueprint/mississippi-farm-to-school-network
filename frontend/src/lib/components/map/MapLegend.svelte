<script lang="ts">
	import { MARKER_META, MARKER_TYPE_ORDER } from '$lib/constants/markers';

	const LEGEND_ITEMS = MARKER_TYPE_ORDER.map((type) => ({ type, ...MARKER_META[type] }));

	const CLOSE_DELAY_MS = 150;

	let open = $state(false);
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	function show() {
		clearTimeout(closeTimer);
		open = true;
	}

	function scheduleClose() {
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => (open = false), CLOSE_DELAY_MS);
	}

	function handleFocusOut(event: FocusEvent) {
		const container = event.currentTarget as HTMLElement;
		if (!container.contains(event.relatedTarget as Node | null)) {
			open = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') open = false;
	}

	$effect(() => () => clearTimeout(closeTimer));
</script>

<div
	class="farm-map-legend"
	role="group"
	onmouseenter={show}
	onmouseleave={scheduleClose}
	onfocusin={show}
	onfocusout={handleFocusOut}
	onkeydown={handleKeydown}
>
	<button
		type="button"
		class="farm-map-legend__trigger"
		aria-label="Show map legend"
		aria-expanded={open}
		onclick={show}
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
