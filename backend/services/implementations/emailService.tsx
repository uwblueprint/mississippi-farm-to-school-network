import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { render } from '@react-email/render';
import nodemailer, { Transporter } from 'nodemailer';
import React from 'react';
import IEmailService from '@/services/interfaces/emailService';
import { EmailParagraph, EmailServiceOptions, EmailTemplateData, NodemailerConfig } from '@/types';
import { frontendUrl } from '@/utilities/farmEmails';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

const SENDER_NAME = 'Mississippi Farm to School Network';
const SUPPORT_EMAIL = 'info@uwblueprint.org';
const CONTACT_FORM_URL = 'https://www.mississippifarmtoschool.org/contact';
const CONTACT_FORM_LABEL = 'mississippifarmtoschool.org/contact';
const FONT_STYLESHEET_URL =
  'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap';
const HERO_IMAGE_URL =
  'https://firebasestorage.googleapis.com/v0/b/mississippi-farm-to-scho-11069.firebasestorage.app/o/hero.png?alt=media&token=8a60b1b2-a1d6-43c5-a062-e72bf425c5bb';

export interface EmailLayoutProps extends EmailTemplateData {
  brandName?: string;
}

const renderParagraphs = (paragraphs: EmailParagraph[] = []) =>
  paragraphs.map((paragraph) => (
    <Text
      key={paragraph.map((part) => (typeof part === 'string' ? part : part.bold)).join('')}
      style={bodyText}
    >
      {paragraph.map((part) =>
        typeof part === 'string' ? (
          <React.Fragment key={part}>{part}</React.Fragment>
        ) : (
          <strong key={part.bold} style={boldText}>
            {part.bold}
          </strong>
        )
      )}
    </Text>
  ));

export const EmailLayout = (props: EmailLayoutProps) => {
  const {
    recipientName,
    title = 'Hello',
    previewText,
    body,
    paragraphs,
    paragraphsAfterReason,
    reasonText,
    ctaText,
    ctaUrl,
    actionButton,
    closingText,
    isFarmerEmail = true,
  } = props;

  const resolvedCtaText = ctaText ?? actionButton?.label;
  const resolvedCtaUrl = ctaUrl ?? actionButton?.href;
  const year = new Date().getFullYear();

  return (
    <Html lang="en">
      <Head>
        <title>{title}</title>
        <link href={FONT_STYLESHEET_URL} rel="stylesheet" />
      </Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={main}>
        <Container style={container}>
          <Section style={heroSection}>
            <Img src={HERO_IMAGE_URL} alt={SENDER_NAME} width="600" style={heroImage} />
          </Section>

          <Section style={contentSection}>
            {recipientName && <Text style={bodyText}>Hi {recipientName},</Text>}
            {body && <Text style={bodyText}>{body}</Text>}
            {renderParagraphs(paragraphs)}

            {reasonText && <Text style={reasonBox}>{reasonText}</Text>}
            {renderParagraphs(paragraphsAfterReason)}

            {resolvedCtaText && resolvedCtaUrl && (
              <Section style={ctaContainer}>
                <Button style={button} href={resolvedCtaUrl}>
                  {resolvedCtaText}
                  <span style={buttonArrow}>&nbsp;&rarr;</span>
                </Button>
              </Section>
            )}

            {closingText && <Text style={closingTextStyle}>{closingText}</Text>}
          </Section>

          <Section style={footer}>
            {isFarmerEmail ? (
              <>
                <Text style={{ ...farmerFooterText, margin: '0 0 24px 0' }}>
                  You&apos;re receiving this email because you&apos;re a registered farmer on the
                  MFSN Farm Fresh Map. Contact support at{' '}
                  <a href={CONTACT_FORM_URL} style={footerLink}>
                    {CONTACT_FORM_LABEL}
                  </a>
                </Text>
                <Text style={{ ...farmerFooterText, margin: '0 0 8px 0' }}>
                  <strong style={boldText}>MFSN Farm Fresh Map - </strong>
                  <a href={frontendUrl('/farms')} style={{ ...footerLink, fontWeight: 400 }}>
                    View Map
                  </a>
                </Text>
                <Text style={farmerFooterText}>
                  &copy; {year} {SENDER_NAME}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ ...adminFooterText, fontWeight: 700, margin: '0 0 8px 0' }}>
                  MFSN Farm Fresh Map
                </Text>
                <Text style={{ ...adminFooterText, margin: '0 0 16px 0' }}>
                  &copy; {year} {SENDER_NAME}
                </Text>
                <Text style={adminFooterText}>
                  Contact support at{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} style={footerLink}>
                    {SUPPORT_EMAIL}
                  </a>
                </Text>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

class EmailService implements IEmailService {
  private transporter: Transporter;

  private brandName: string;

  private sender: string;

  constructor(
    nodemailerConfig: NodemailerConfig,
    displayName: string = SENDER_NAME,
    options?: EmailServiceOptions
  ) {
    this.transporter = nodemailer.createTransport(nodemailerConfig);
    this.brandName = options?.brandName ?? displayName;
    this.sender = `${displayName} <${nodemailerConfig.auth.user}>`;
  }

  async renderTemplate(template: EmailTemplateData): Promise<string> {
    const templateProps: EmailLayoutProps = {
      ...template,
      brandName: this.brandName,
    };
    return render(React.createElement(EmailLayout, templateProps));
  }

  async sendEmail(
    to: string,
    subject: string,
    template: string | EmailTemplateData
  ): Promise<void> {
    const html: string =
      typeof template === 'string' ? template : await this.renderTemplate(template);

    const mailOptions = {
      from: this.sender,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(`Failed to send email. Reason = ${errorMessage}`);
      throw error;
    }
  }
}

export default EmailService;

const FONT_FAMILY =
  '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const main = {
  backgroundColor: '#ffffff00',
  fontFamily: FONT_FAMILY,
  margin: '0',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  width: '600px',
  maxWidth: '600px',
};

const heroSection = {
  textAlign: 'center' as const,
  lineHeight: '0',
};

const heroImage = {
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
  display: 'block',
};

const contentSection = {
  padding: '32px',
  backgroundColor: '#ffffff',
};

const bodyText = {
  fontFamily: FONT_FAMILY,
  fontSize: '16px',
  fontWeight: 500,
  lineHeight: '24px',
  color: '#000000',
  margin: '0 0 24px 0',
};

const boldText = {
  fontWeight: 700,
};

const reasonBox = {
  backgroundColor: '#e2e8d9',
  borderLeft: '4px solid #587244',
  padding: '16px',
  margin: '0 0 24px 0',
  fontFamily: FONT_FAMILY,
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '16px',
  color: '#263d13',
  whiteSpace: 'pre-wrap' as const,
};

const ctaContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#587244',
  color: '#ffffff',
  padding: '13px 12px',
  textDecoration: 'none',
  borderRadius: '8px',
  fontFamily: FONT_FAMILY,
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '21px',
  display: 'inline-block',
};

const buttonArrow = {
  fontSize: '20px',
  lineHeight: '20px',
  verticalAlign: 'middle',
};

const closingTextStyle = {
  ...bodyText,
  margin: '24px 0 0 0',
};

const footer = {
  backgroundColor: '#f5f6f8',
  borderTop: '2px solid #f5f6f8',
  padding: '32px',
};

const adminFooterText = {
  fontFamily: FONT_FAMILY,
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '16px',
  color: '#696c78',
  margin: '0',
};

const farmerFooterText = {
  ...adminFooterText,
  lineHeight: '1.4',
};

const footerLink = {
  color: '#587244',
  textDecoration: 'underline',
};
