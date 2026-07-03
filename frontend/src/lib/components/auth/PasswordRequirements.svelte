<script lang="ts">
	import { PASSWORD_REQUIREMENTS } from '$lib/auth';

	interface Props {
		password: string;
	}

	let { password }: Props = $props();
</script>

<div class="auth-requirements-box">
	<p class="auth-requirements-title">Your password must contain:</p>
	<ul class="auth-requirements" aria-label="Password requirements">
		{#each PASSWORD_REQUIREMENTS as requirement (requirement.id)}
			{@const met = requirement.test(password)}
			<li class="auth-requirement" class:auth-requirement--met={met}>
				<img
					class="auth-requirement-icon"
					class:auth-requirement-icon--cross={!met}
					src={met ? '/images/auth/check.svg' : '/images/auth/cross.svg'}
					alt=""
					aria-hidden="true"
				/>
				{requirement.label}
			</li>
		{/each}
	</ul>
</div>
