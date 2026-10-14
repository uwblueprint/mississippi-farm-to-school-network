<script lang="ts">
	import type { ReviewSection } from '$lib/utils/farm-request-sections';

	interface Props {
		sections: ReviewSection[];
	}

	let { sections }: Props = $props();
</script>

{#each sections as section (section.title)}
	<hr class="farm-request-modal__divider" />

	<section class="farm-request-modal__section">
		<h3 class="farm-request-modal__section-title">{section.title}</h3>
		{#each section.fields as field, index (`${section.title}-${index}`)}
			<div class="farm-request-modal__field">
				{#if field.label}
					<p class="farm-request-modal__field-label">{field.label}</p>
				{/if}
				<p class="farm-request-modal__field-value">
					{#if field.kind === 'list'}
						{(field.values ?? []).join(', ')}
					{:else}
						{field.value}
					{/if}
				</p>
			</div>
		{/each}
	</section>
{/each}
