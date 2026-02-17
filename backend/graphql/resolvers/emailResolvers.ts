import EmailService from '@/services/implementations/emailService';
import IEmailService from '@/services/interfaces/emailService';
import nodemailerConfig from '@/nodemailer.config';

const emailService: IEmailService = new EmailService(nodemailerConfig);

const emailResolvers = {
  Mutation: {
    sendEmail: async (
      _: unknown,
      {
        to,
        subject,
        htmlBody,
      }: { to: string; subject: string; htmlBody: string }
    ) => {
      await emailService.sendEmail(to, subject, htmlBody);
      return true;
    },
  },
};

export default emailResolvers;
