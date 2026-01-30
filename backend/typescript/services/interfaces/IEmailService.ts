export interface IEmailService {
  /**
   * send email to the given recipient
   * @param to recipient's email
   * @param subject email subject
   * @param htmlBody email body as html
   * @returns void when sent successfully
   * @throws Error if email was not sent successfully
   */
  sendEmail(to: string, subject: string, htmlBody: string): Promise<void>;
}
