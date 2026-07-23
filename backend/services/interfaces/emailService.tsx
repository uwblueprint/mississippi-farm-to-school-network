import { EmailTemplateData } from '@/types';
 
interface IEmailService {
  /**
   * Send email
   * @param to recipient's email
   * @param subject email subject
   * @param template email body as raw HTML or a structured template payload
   * @throws Error if email was not sent successfully
   */
  sendEmail(to: string, subject: string, template: string | EmailTemplateData): Promise<void>;
  renderTemplate(template: EmailTemplateData): Promise<string>;
}
 
export default IEmailService;
 