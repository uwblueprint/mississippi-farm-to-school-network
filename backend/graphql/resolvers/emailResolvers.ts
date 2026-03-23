import EmailService from '@/services/implementations/emailService';
import IEmailService from '@/services/interfaces/emailService';
import nodemailerConfig from '@/nodemailer.config';
import { AuthContext } from '@/middlewares/auth';
import authHelper from '@/utilities/authHelpers';
import { Role } from '@/types';


const emailService: IEmailService = new EmailService(nodemailerConfig);

const emailResolvers = {
  Mutation: {
    sendEmail: async (
      _: unknown,
      { to, subject, htmlBody }: { to: string; subject: string; htmlBody: string },
      context: AuthContext
    ): Promise<boolean> => {
      await authHelper.requireRole(context, [Role.ADMIN]);
      await emailService.sendEmail(to, subject, htmlBody);
      return true;
    },
  },
};

export default emailResolvers;
