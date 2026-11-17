import { AuthContext } from '@/middlewares/auth';
import FormService from '@/services/implementations/formService';
import IFormService from '@/services/interfaces/formService';
import { FormSection, FormVersionDTO, Role } from '@/types';
import authHelper from '@/utilities/authHelpers';

const formService: IFormService = new FormService();

const formResolvers = {
  Query: {
    publishedForm: async (
      _parent: undefined,
      _args: undefined,
      context: AuthContext
    ): Promise<FormVersionDTO> => {
      await authHelper.requireRole(context, [Role.ADMIN, Role.FARMER]);
      return formService.getPublishedForm();
    },
  },
  Mutation: {
    saveForm: async (
      _parent: undefined,
      { baseVersionId, sections }: { baseVersionId: string; sections: FormSection[] },
      context: AuthContext
    ): Promise<FormVersionDTO> => {
      const admin = await authHelper.requireRole(context, [Role.ADMIN]);
      return formService.saveForm(admin.id, baseVersionId, sections);
    },
  },
};

export default formResolvers;
