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
      {
        to,
        subject,
        htmlBody,
        title,
        body,
        actionButtonLabel,
        actionButtonHref,
        previewText,
        footerText,
        recipientName,
        reasonText,
        ctaText,
        ctaUrl,
        isFarmerEmail,
      }: {
        to: string;
        subject: string;
        htmlBody?: string;
        title?: string;
        body?: string;
        actionButtonLabel?: string;
        actionButtonHref?: string;
        previewText?: string;
        footerText?: string;
        recipientName?: string;
        reasonText?: string;
        ctaText?: string;
        ctaUrl?: string;
        isFarmerEmail?: boolean;
      },
      context: AuthContext
    ): Promise<boolean> => {
      await authHelper.requireRole(context, [Role.ADMIN]);

      const payload = htmlBody
        ? htmlBody
        : {
            title: title ?? 'Hello',
            body: body ?? '',
            previewText,
            footerText,
            recipientName,
            reasonText,
            ctaText: ctaText ?? actionButtonLabel,
            ctaUrl: ctaUrl ?? actionButtonHref,
            isFarmerEmail,
            actionButton:
              actionButtonLabel && actionButtonHref
                ? { label: actionButtonLabel, href: actionButtonHref }
                : undefined,
          };

      await emailService.sendEmail(to, subject, payload);
      return true;
    },
  },
};

export default emailResolvers;
