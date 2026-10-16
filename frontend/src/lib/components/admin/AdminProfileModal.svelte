<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import type { AdminProfile } from '$lib/types/admin';

	interface Props {
		profile: AdminProfile;
		onClose: () => void;
	}

	let { profile, onClose }: Props = $props();

	const ROLE_LABEL = { ADMIN: 'Admin', FARMER: 'Farmer' } as const;
</script>

<Modal label="Your profile" {onClose}>
	<div class="admin-profile">
		<h2 class="admin-profile__title">Your Profile</h2>
		<dl class="admin-profile__fields">
			<div class="admin-profile__field">
				<dt>Name</dt>
				<dd>{profile.name}</dd>
			</div>
			<div class="admin-profile__field">
				<dt>Email</dt>
				<dd>{profile.email}</dd>
			</div>
			<div class="admin-profile__field">
				<dt>Role</dt>
				<dd>{ROLE_LABEL[profile.role]}</dd>
			</div>
		</dl>
	</div>
</Modal>
