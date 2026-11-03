import type { Transaction } from 'firebase-admin/firestore';
import { FormSection, FormVersionDTO } from '@/types';

interface IFormService {
  /**
   * Get the latest published farmer form, seeding version 1 from the default
   * form the first time it's read
   * @param tx optional transaction to read it in (the form must already be seeded)
   * @returns the latest FormVersionDTO
   * @throws Error if retrieval fails
   */
  getPublishedForm(tx?: Transaction): Promise<FormVersionDTO>;

  /**
   * Get one version of the farmer form
   * @param id the form version's id
   * @returns the FormVersionDTO
   * @throws Error if no version has that id
   */
  getFormVersion(id: string): Promise<FormVersionDTO>;

  /**
   * Publish a new version of the farmer form. Older versions are kept unchanged.
   * @param adminId id of the admin publishing it
   * @param baseVersionId the version the admin edited, which must still be the latest
   * @param sections the form's sections and questions
   * @returns the new FormVersionDTO
   * @throws UserInputError if the form is invalid or a newer version was published meanwhile
   */
  saveForm(
    adminId: string,
    baseVersionId: string,
    sections: FormSection[]
  ): Promise<FormVersionDTO>;
}

export default IFormService;
