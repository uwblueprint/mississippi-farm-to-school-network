import { UserInputError } from 'apollo-server';
import type { Transaction } from 'firebase-admin/firestore';
import { DEFAULT_FORM_SECTIONS, INITIAL_FORM_VERSION_ID } from '@/constants/defaultForm';
import IFormService from '@/services/interfaces/formService';
import { FormSection, FormVersionDTO } from '@/types';
import { getErrorMessage } from '@/utilities/errorUtils';
import { Collections, getFirestore, toIso } from '@/utilities/firestore';
import { normalizeFormSections } from '@/utilities/formAnswers';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

const STALE_FORM_MESSAGE =
  'Someone published a newer version of the form while you were editing. Reload to see it before saving.';

type FormVersionDoc = {
  version: number;
  sections: FormSection[];
  created_by: string | null;
  created_at: string;
};

class FormService implements IFormService {
  private versions() {
    return getFirestore().collection(Collections.formVersions);
  }

  private convertToFormVersionDTO(id: string, data: FormVersionDoc): FormVersionDTO {
    return {
      id,
      version: data.version,
      sections: data.sections,
      createdBy: data.created_by ?? null,
      createdAt: toIso(data.created_at),
    };
  }

  /** Writes version 1 (the form farmers filled before it was editable) if it doesn't exist yet. */
  private async ensureSeeded(): Promise<void> {
    const ref = this.versions().doc(INITIAL_FORM_VERSION_ID);
    await getFirestore().runTransaction(async (tx) => {
      if ((await tx.get(ref)).exists) return;
      tx.create(ref, {
        version: 1,
        sections: DEFAULT_FORM_SECTIONS,
        created_by: null,
        created_at: new Date().toISOString(),
      });
    });
  }

  async getPublishedForm(tx?: Transaction): Promise<FormVersionDTO> {
    try {
      if (!tx) await this.ensureSeeded();
      const snap = tx ? await tx.get(this.versions()) : await this.versions().get();
      const [latest] = snap.docs.sort(
        (a, b) => (b.data() as FormVersionDoc).version - (a.data() as FormVersionDoc).version
      );
      if (!latest) throw new Error('No farmer form has been published.');
      return this.convertToFormVersionDTO(latest.id, latest.data() as FormVersionDoc);
    } catch (error: unknown) {
      Logger.error(`Failed to get published form. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getFormVersion(id: string): Promise<FormVersionDTO> {
    try {
      if (id === INITIAL_FORM_VERSION_ID) await this.ensureSeeded();
      const doc = await this.versions().doc(id).get();
      if (!doc.exists) throw new Error(`Form version ${id} not found.`);
      return this.convertToFormVersionDTO(doc.id, doc.data() as FormVersionDoc);
    } catch (error: unknown) {
      Logger.error(`Failed to get form version ${id}. Reason = ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async saveForm(
    adminId: string,
    baseVersionId: string,
    sections: FormSection[]
  ): Promise<FormVersionDTO> {
    try {
      const normalized = normalizeFormSections(sections);
      await this.ensureSeeded();

      return await getFirestore().runTransaction(async (tx) => {
        const latest = await this.getPublishedForm(tx);
        if (latest.id !== baseVersionId) throw new UserInputError(STALE_FORM_MESSAGE);

        const id = `v${latest.version + 1}`;
        const data: FormVersionDoc = {
          version: latest.version + 1,
          sections: normalized,
          created_by: adminId,
          created_at: new Date().toISOString(),
        };
        // create (not set): a concurrent save that took this version number makes this fail.
        tx.create(this.versions().doc(id), data);
        return this.convertToFormVersionDTO(id, data);
      });
    } catch (error: unknown) {
      Logger.error(`Failed to save form. Reason = ${getErrorMessage(error)}`);
      if ((error as { code?: number }).code === 6 /* ALREADY_EXISTS */) {
        throw new UserInputError(STALE_FORM_MESSAGE);
      }
      throw error;
    }
  }
}

export default FormService;
