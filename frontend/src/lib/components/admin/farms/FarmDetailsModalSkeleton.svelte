<script lang="ts">
	const contactRows = [0, 1, 2, 3, 4, 5] as const;
	const leftSections = [
		{ fields: 2 },
		{ fields: 3 },
		{ fields: 3 }
	] as const;
	const asideSections = [{ fields: 2 }, { fields: 3 }] as const;
</script>

<div class="farm-modal-skeleton" aria-hidden="true">
	<div class="farm-request-modal__columns">
		<div class="farm-request-modal__details">
			<div class="farm-request-modal__meta">
				<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--meta"></span>
			</div>

			<div class="farm-request-modal__title-row">
				<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--title"></span>
				<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--pill"></span>
			</div>

			<div class="farm-request-modal__contact">
				{#each contactRows as row (row)}
					<div class="farm-request-modal__contact-row">
						<span class="farm-modal-skeleton__icon"></span>
						<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--label"></span>
						<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--value"></span>
					</div>
				{/each}
			</div>

			{#each leftSections as section, index (index)}
				<hr class="farm-request-modal__divider" />
				<section class="farm-request-modal__section">
					<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--heading"></span>
					{#each Array.from({ length: section.fields }, (_, i) => i) as field (field)}
						<div class="farm-request-modal__field">
							<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--field-label"></span>
							<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--field-value"></span>
						</div>
					{/each}
				</section>
			{/each}
		</div>

		<aside class="farm-request-modal__aside">
			<div class="farm-request-modal__gallery">
				<div class="farm-modal-skeleton__photo"></div>
				<div class="farm-request-modal__dots">
					<span class="farm-modal-skeleton__dot"></span>
					<span class="farm-modal-skeleton__dot"></span>
					<span class="farm-modal-skeleton__dot"></span>
				</div>
			</div>

			{#each asideSections as section, index (index)}
				<hr class="farm-request-modal__divider" />
				<section class="farm-request-modal__section">
					<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--heading"></span>
					{#each Array.from({ length: section.fields }, (_, i) => i) as field (field)}
						<div class="farm-request-modal__field">
							<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--field-label"></span>
							<span class="farm-modal-skeleton__bar farm-modal-skeleton__bar--field-value"></span>
						</div>
					{/each}
				</section>
			{/each}
		</aside>
	</div>
</div>
