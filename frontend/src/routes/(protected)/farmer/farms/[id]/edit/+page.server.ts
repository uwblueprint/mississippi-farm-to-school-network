import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { gqlRequest } from '$lib/server/graphql';
import {
	farmToFormModel,
	formModelToUpdateInput,
	type FarmDTO,
	type FarmFormModel,
	type FarmStatus
} from '$lib/farmMapping';

// --- GraphQL documents ------------------------------------------------------

// Owner-or-admin read of a single farm (see backend farmResolvers UNIT 2).
// [id] is the farm UUID — the same id used by updateFarm/resubmitFarm.
const FARM_BY_ID = `
	query FarmById($id: ID!) {
		farmById(id: $id) {
			id
			usda_farm_id
			farm_name
			farm_address
			primary_phone
			primary_email
			website
			social_media
			status
		}
	}
`;

// Owner-or-admin; returns null unless the farm is REJECTED.
const LATEST_REJECTION = `
	query LatestActiveFarmRejection($farmId: ID!) {
		latestActiveFarmRejection(farmId: $farmId) {
			rejection_reason
			created_at
		}
	}
`;

// Owner-or-admin list of a farm's uploaded images (oldest-first).
const FILES_BY_FARM = `
	query FilesByFarm($farmId: String!) {
		filesByFarm(farmId: $farmId) {
			fileId
			url
			originalFileName
		}
	}
`;

const UPDATE_FARM = `
	mutation UpdateFarm($id: ID!, $input: UpdateFarmInput!) {
		updateFarm(id: $id, input: $input) {
			id
			status
		}
	}
`;

const RESUBMIT_FARM = `
	mutation ResubmitFarm($id: ID!, $input: UpdateFarmInput!) {
		resubmitFarm(id: $id, input: $input) {
			id
			status
		}
	}
`;

const UPLOAD_FARM_IMAGE = `
	mutation UploadFarmImage(
		$farmId: String!
		$originalFileName: String!
		$contentType: String!
		$dataBase64: String!
	) {
		uploadFarmImage(
			farmId: $farmId
			originalFileName: $originalFileName
			contentType: $contentType
			dataBase64: $dataBase64
		) {
			fileId
			url
			originalFileName
		}
	}
`;

const DELETE_FILE = `
	mutation DeleteFile($fileId: String!) {
		deleteFile(fileId: $fileId)
	}
`;

// --- Types shared with +page.svelte (SHARED CONTRACT) -----------------------

interface FarmImage {
	fileId: string;
	url: string;
	originalFileName: string;
}

interface RejectionInfo {
	reason: string;
	createdAt: string;
}

// Map a thrown gqlRequest error onto the right SvelteKit HTTP error.
function toHttpError(err: unknown): never {
	const message = err instanceof Error ? err.message : String(err);
	if (/not found/i.test(message)) {
		throw error(404, 'Farm not found');
	}
	if (/forbidden|not authorized|permission/i.test(message)) {
		throw error(403, 'You do not have access to this farm');
	}
	throw error(500, message);
}

export const load: PageServerLoad = async ({ params, cookies, fetch }) => {
	const token = cookies.get('token');
	const id = params.id;

	let farm: FarmDTO;
	try {
		const data = await gqlRequest<{ farmById: FarmDTO }>({
			query: FARM_BY_ID,
			variables: { id },
			token,
			fetch
		});
		farm = data.farmById;
	} catch (err) {
		toHttpError(err);
	}

	const form: FarmFormModel = farmToFormModel(farm);
	const status: FarmStatus = farm.status;

	// Rejection banner data + image gallery. Both are owner-authed and
	// independent, so fetch them in parallel. Failures here are non-fatal
	// (the page still renders), so degrade gracefully to null / [].
	const [rejectionRes, imagesRes] = await Promise.allSettled([
		gqlRequest<{
			latestActiveFarmRejection: { rejection_reason: string; created_at: string } | null;
		}>({ query: LATEST_REJECTION, variables: { farmId: id }, token, fetch }),
		gqlRequest<{ filesByFarm: FarmImage[] }>({
			query: FILES_BY_FARM,
			variables: { farmId: id },
			token,
			fetch
		})
	]);

	let rejection: RejectionInfo | null = null;
	if (rejectionRes.status === 'fulfilled') {
		const r = rejectionRes.value.latestActiveFarmRejection;
		if (r) {
			rejection = { reason: r.rejection_reason, createdAt: r.created_at };
		}
	}

	const images: FarmImage[] =
		imagesRes.status === 'fulfilled' ? (imagesRes.value.filesByFarm ?? []) : [];

	// The dashboard image name comes from the file service, not FarmDTO
	// (see UNIT 1 concern) — overlay the first uploaded image's name if any.
	if (images.length > 0) {
		form.dashboardImageName = images[0].originalFileName;
	}

	return { form, status, rejection, images };
};

// --- Helpers ----------------------------------------------------------------

// Encode file bytes as raw base64 (no data: prefix) without relying on Node's
// Buffer type, which svelte-check does not surface in this project's tsconfig.
function toBase64(bytes: Uint8Array): string {
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

// Rebuild the FarmFormModel from posted form fields. Field names match the
// FarmFormModel keys (SHARED CONTRACT — +page.svelte names its inputs to match).
function formDataToModel(data: FormData): FarmFormModel {
	const str = (key: string) => (data.get(key) ?? '').toString();
	return {
		readableId: str('readableId'),
		name: str('name'),
		address: str('address'),
		counties: str('counties'), // TODO(backend-mapping): not persisted
		phone: str('phone'),
		email: str('email'),
		instagram: str('instagram'),
		facebook: str('facebook'),
		website: str('website'),
		other: str('other'),
		seasonal: str('seasonal'), // TODO(backend-mapping): not persisted
		dashboardImageName: str('dashboardImageName')
	};
}

export const actions: Actions = {
	// Persist the clean editable fields. REJECTED farms resubmit (which also
	// re-enters the approval queue); all others use updateFarm.
	save: async ({ request, params, cookies, fetch }) => {
		const token = cookies.get('token');
		const data = await request.formData();
		const status = (data.get('status') ?? '').toString() as FarmStatus;
		const input = formModelToUpdateInput(formDataToModel(data));

		const mutation = status === 'REJECTED' ? RESUBMIT_FARM : UPDATE_FARM;

		try {
			await gqlRequest<{ updateFarm?: FarmDTO; resubmitFarm?: FarmDTO }>({
				query: mutation,
				variables: { id: params.id, input },
				token,
				fetch
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save farm';
			return fail(422, { message });
		}

		return { success: true };
	},

	// Upload a single image (FormData field 'file') as raw base64 bytes.
	uploadImage: async ({ request, params, cookies, fetch }) => {
		const token = cookies.get('token');
		const data = await request.formData();
		const file = data.get('file');

		if (!(file instanceof File) || file.size === 0) {
			return fail(422, { message: 'No file provided' });
		}

		const dataBase64 = toBase64(new Uint8Array(await file.arrayBuffer()));
		const contentType = file.type || 'application/octet-stream';

		try {
			const res = await gqlRequest<{ uploadFarmImage: FarmImage }>({
				query: UPLOAD_FARM_IMAGE,
				variables: {
					farmId: params.id,
					originalFileName: file.name,
					contentType,
					dataBase64
				},
				token,
				fetch
			});
			return { success: true, image: res.uploadFarmImage };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to upload image';
			return fail(422, { message });
		}
	},

	// Remove an image by its fileId (FormData field 'fileId').
	removeImage: async ({ request, cookies, fetch }) => {
		const token = cookies.get('token');
		const data = await request.formData();
		const fileId = (data.get('fileId') ?? '').toString();

		if (!fileId) {
			return fail(422, { message: 'No fileId provided' });
		}

		try {
			await gqlRequest<{ deleteFile: boolean }>({
				query: DELETE_FILE,
				variables: { fileId },
				token,
				fetch
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to remove image';
			return fail(422, { message });
		}

		return { success: true };
	}
};
