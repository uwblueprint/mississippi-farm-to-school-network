<script lang="ts">
	import { onMount } from 'svelte';
	import { gqlClient } from '$lib/graphqlClient';
	import { showToast } from '$lib/state/toast.svelte';
	import type { FormQuestion, FormQuestionType, FormSection, FormVersion } from '$lib/types/form';
	import { FORM_VERSION_FIELDS, PUBLISHED_FORM_QUERY, allQuestions } from '$lib/utils/form-answers';

	const SAVE_FORM_MUTATION = `
		mutation SaveForm($baseVersionId: ID!, $sections: [FormSectionInput!]!) {
			saveForm(baseVersionId: $baseVersionId, sections: $sections) {${FORM_VERSION_FIELDS}
			}
		}
	`;

	const TYPE_LABELS: Record<Exclude<FormQuestionType, 'LOCKED'>, string> = {
		TEXT: 'Short text',
		TEXTAREA: 'Long text',
		NUMBER: 'Whole number',
		URL: 'Link',
		CHECKBOX: 'Checkboxes'
	};

	let published = $state<FormVersion | null>(null);
	let sections = $state<FormSection[]>([]);
	let error = $state<string | null>(null);
	let saving = $state(false);
	let selectedId = $state<string | null>(null);

	// Questions already published keep their type: farms have answered them as that type.
	const publishedIds = $derived(new Set(published ? allQuestions(published).map((q) => q.id) : []));
	const questions = $derived(sections.flatMap((section) => section.questions));
	const selected = $derived(questions.find((question) => question.id === selectedId) ?? null);
	const isDirty = $derived(
		published !== null && JSON.stringify(sections) !== JSON.stringify(published.sections)
	);

	onMount(async () => {
		try {
			const { publishedForm } = await gqlClient<{ publishedForm: FormVersion }>(
				PUBLISHED_FORM_QUERY
			);
			published = publishedForm;
			sections = structuredClone(publishedForm.sections);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not load the form.';
		}
	});

	async function save() {
		if (!published || saving) return;
		saving = true;
		error = null;
		try {
			const { saveForm } = await gqlClient<{ saveForm: FormVersion }>(SAVE_FORM_MUTATION, {
				baseVersionId: published.id,
				sections
			});
			published = saveForm;
			sections = structuredClone(saveForm.sections);
			showToast(
				'success',
				'New farms will fill out this version.',
				`Form version ${saveForm.version} published`
			);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not save the form.';
		} finally {
			saving = false;
		}
	}

	const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().slice(0, 8)}`;

	/** Refuses (with a message) when another question's condition depends on this question/choice. */
	function usedByCondition(questionId: string, optionId?: string): boolean {
		const dependent = questions.find(
			(q) =>
				q.showIf?.questionId === questionId &&
				(optionId === undefined || q.showIf.optionIds.includes(optionId))
		);
		if (dependent) error = `Can't remove it: it decides whether “${dependent.label}” is shown.`;
		return Boolean(dependent);
	}

	function addQuestion(section: FormSection) {
		const id = newId('q');
		section.questions.push({
			id,
			type: 'TEXT',
			label: 'New question',
			required: false,
			placeholder: null,
			helpText: null,
			options: [],
			exclusiveOptionId: null,
			showIf: null,
			lockedField: null
		});
		selectedId = id;
	}

	function removeQuestion(question: FormQuestion) {
		error = null;
		if (usedByCondition(question.id)) return;
		for (const section of sections) {
			section.questions = section.questions.filter((q) => q.id !== question.id);
		}
		selectedId = null;
	}

	function changeType(question: FormQuestion, type: FormQuestionType) {
		question.type = type;
		question.exclusiveOptionId = null;
		question.options = type === 'CHECKBOX' ? [{ id: newId('opt'), label: 'Choice 1' }] : [];
	}

	function removeOption(question: FormQuestion, optionId: string) {
		error = null;
		if (question.options.length === 1) {
			error = 'A checkbox question needs at least one choice.';
			return;
		}
		if (usedByCondition(question.id, optionId)) return;
		question.options = question.options.filter((option) => option.id !== optionId);
		if (question.exclusiveOptionId === optionId) question.exclusiveOptionId = null;
	}
</script>

<svelte:head>
	<title>Farmer Form</title>
</svelte:head>

<main class="admin-page form-admin">
	<div class="admin-page__inner">
		<div class="admin-page__header form-admin__header">
			<h1 class="admin-page__title">Farmer Form</h1>
			{#if published}
				<span class="admin-page__count">Version {published.version}</span>
				<button class="btn--primary btn" type="button" onclick={save} disabled={!isDirty || saving}>
					{saving ? 'Saving…' : 'Save'}
				</button>
			{/if}
		</div>

		<p class="form-admin__hint">
			Saving publishes a new version for new farms. Farms already submitted keep their questions.
			Locked rows power the map, farm list and admin table, so they can't be changed.
		</p>

		{#if error}
			<p class="form-admin__error" role="alert">{error}</p>
		{/if}

		{#if published}
			<div class="form-admin__columns">
				<div class="form-admin__list">
					{#each sections as section (section.id)}
						<section class="form-section">
							<h2 class="form-section__title">{section.title}</h2>
							{#each section.questions as question (question.id)}
								<button
									class="question-row"
									class:question-row--selected={question.id === selectedId}
									type="button"
									onclick={() => {
										selectedId = question.id;
										error = null;
									}}
								>
									<span>{question.label}</span>
									<span class="tag">
										{question.type === 'LOCKED'
											? 'Locked'
											: `${TYPE_LABELS[question.type]}${question.required ? ' · Required' : ''}`}
									</span>
								</button>
							{/each}
							<button class="link-btn" type="button" onclick={() => addQuestion(section)}>
								+ Add question
							</button>
						</section>
					{/each}
				</div>

				<aside class="form-admin__editor" aria-label="Question editor">
					{#if !selected}
						<p class="form-admin__hint">Select a question to edit it.</p>
					{:else if selected.type === 'LOCKED'}
						<h2 class="form-section__title">{selected.label}</h2>
						<p class="form-admin__hint">This question is always on the form and can't be edited.</p>
					{:else}
						{@const question = selected}
						<label class="editor__field">
							<span>Question</span>
							<input class="editor__input" bind:value={question.label} />
						</label>

						<label class="editor__field">
							<span>Answer type</span>
							<select
								class="editor__input"
								value={question.type}
								disabled={publishedIds.has(question.id)}
								onchange={(e) => changeType(question, e.currentTarget.value as FormQuestionType)}
							>
								{#each Object.entries(TYPE_LABELS) as [type, label] (type)}
									<option value={type}>{label}</option>
								{/each}
							</select>
						</label>

						<label class="editor__check">
							<input type="checkbox" bind:checked={question.required} />
							Required
						</label>

						{#if question.type === 'CHECKBOX'}
							<fieldset class="editor__field">
								<legend>Choices</legend>
								{#each question.options as option (option.id)}
									<div class="choice-row">
										<input class="editor__input" aria-label="Choice" bind:value={option.label} />
										<button
											class="link-btn link-btn--danger"
											type="button"
											onclick={() => removeOption(question, option.id)}>Remove</button
										>
									</div>
								{/each}
								<button
									class="link-btn"
									type="button"
									onclick={() =>
										question.options.push({
											id: newId('opt'),
											label: `Choice ${question.options.length + 1}`
										})}>+ Add choice</button
								>
							</fieldset>
						{/if}

						<button
							class="link-btn link-btn--danger"
							type="button"
							onclick={() => removeQuestion(question)}
						>
							Remove question
						</button>
					{/if}
				</aside>
			</div>
		{/if}
	</div>
</main>

<style>
	.form-admin {
		color: #131927;
		font-family: 'DM Sans', sans-serif;
	}

	.form-admin__header .btn {
		margin-left: auto;
	}

	.form-admin__hint {
		margin: 0;
		font-size: 0.9375rem;
		color: #666;
	}

	.form-admin__error {
		margin: 0;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		background: #fdece9;
		color: #b42318;
		font-size: 0.875rem;
	}

	.form-admin__columns {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: 2rem;
		align-items: start;
	}

	.form-admin__list,
	.form-section,
	.form-admin__editor,
	.editor__field {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-admin__list {
		gap: 1.5rem;
	}

	.form-admin__editor {
		position: sticky;
		top: 1.5rem;
		padding: 1.5rem;
		border: 1px solid #d8d8d8;
		border-radius: 12px;
		background: #fafaf8;
	}

	.form-section__title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 500;
	}

	.question-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border: 1px solid #d8d8d8;
		border-radius: 8px;
		background: #fff;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.question-row--selected {
		border-color: var(--mfsn-primary);
		box-shadow: 0 0 0 1px var(--mfsn-primary);
	}

	.tag {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: #666;
	}

	.editor__field {
		gap: 0.375rem;
		margin: 0;
		padding: 0;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.editor__input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d8d8d8;
		border-radius: 8px;
		font: inherit;
		font-weight: 400;
	}

	.editor__check {
		display: flex;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.choice-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1.125rem;
		border: none;
		border-radius: 8px;
		font: inherit;
		font-weight: 500;
		cursor: pointer;
	}

	.btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.btn--primary {
		background: var(--mfsn-primary);
		color: #fff;
	}

	.link-btn {
		align-self: flex-start;
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--mfsn-primary);
		cursor: pointer;
	}

	.link-btn--danger {
		color: #c0341c;
	}
</style>
