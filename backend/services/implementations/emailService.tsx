import {
  Body,
  Button,
  Container,
  Head,
  Heading,
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
import { EmailServiceOptions, EmailTemplateData, NodemailerConfig } from '@/types';
import logger from '@/utilities/logger';

const Logger = logger(__filename);

export interface EmailLayoutProps extends EmailTemplateData {
  brandName?: string;
}

export const EmailLayout = (props: EmailLayoutProps) => {
  const {
    recipientName,
    title = 'Hello',
    previewText,
    body,
    reasonText,
    ctaText,
    ctaUrl,
    actionButton,
    isFarmerEmail = true,
  } = props;

  const resolvedCtaText = ctaText ?? actionButton?.label;
  const resolvedCtaUrl = ctaUrl ?? actionButton?.href;
  const heroImageUrl = 'https://raw.githubusercontent.com/dcheng6775/msfn-temp/main/hero.png';

  return (
    <Html lang="en">
      <Head>
        <title>{title}</title>
      </Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={main}>
        <Container style={container}>
          <Section style={heroSection}>
            <Img
              src={heroImageUrl}
              alt="Mississippi Farm to School Network"
              width="600"
              style={heroImage}
            />
          </Section>

          <Section style={contentSection}>
            {recipientName && <Text style={recipientStyle}>Hi {recipientName},</Text>}
            {title && <Heading style={heading}>{title}</Heading>}
            {body && <Text style={bodyText}>{body}</Text>}
            {previewText && <Text style={previewStyle}>{previewText}</Text>}

            {reasonText && <Section style={reasonBox}>{reasonText}</Section>}

            {resolvedCtaText && resolvedCtaUrl && (
              <Section style={ctaContainer}>
                <Button style={button} href={resolvedCtaUrl}>
                  {resolvedCtaText} &rarr;
                </Button>
              </Section>
            )}
          </Section>

          <Section style={footer}>
            {isFarmerEmail ? (
              <>
                <Text style={footerText}>
                  You&apos;re receiving this email because you&apos;re a registered farmer on the MFSN Farm Fresh Map. Contact support at <a href="mailto:info@uwblueprint.org" style={footerLink}>info@uwblueprint.org</a>
                </Text>
                <Text style={footerText}>
                  MFSN Farm Fresh Map &ndash; <a href="https://yourmaplink.com" style={footerLink}>View Map</a><br />
                  &copy; {new Date().getFullYear()} Mississippi Farm to School Network
                </Text>
              </>
            ) : (
              <>
                <Text style={{ ...footerText, fontWeight: 'bold', marginBottom: '8px' }}>
                  MFSN Farm Fresh Map
                </Text>
                <Text style={{ ...footerText, marginBottom: '8px' }}>
                  &copy; {new Date().getFullYear()} Mississippi Farm to School Network
                </Text>
                <Text style={footerText}>
                  Contact support at <a href="mailto:info@uwblueprint.org" style={footerLink}>info@uwblueprint.org</a>
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

  constructor(nodemailerConfig: NodemailerConfig, displayName?: string, options?: EmailServiceOptions) {
    this.transporter = nodemailer.createTransport(nodemailerConfig);
    this.brandName = options?.brandName ?? displayName ?? 'Mississippi Farm to School Network';

    if (displayName) {
      this.sender = `${displayName} <${nodemailerConfig.auth.user}>`;
    } else {
      this.sender = nodemailerConfig.auth.user;
    }
  }

  async renderTemplate(template: EmailTemplateData): Promise<string> {
    const templateProps: EmailLayoutProps = {
      ...template,
      brandName: this.brandName,
    };
    return render(React.createElement(EmailLayout, templateProps));
  }

  async sendEmail(to: string, subject: string, template: string | EmailTemplateData): Promise<void> {
    const html: string = typeof template === 'string' ? template : await this.renderTemplate(template);

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

const main = {
  backgroundColor: '#ffffff00',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '40px 0',
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
  padding: '32px 40px',
  backgroundColor: '#ffffff',
};

const recipientStyle = {
  margin: '0 0 16px 0',
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#000',
};

const heading = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '16px',
  fontStyle: 'normal',
  lineHeight: '24px', 
  color: '#000000',     
  margin: '0 0 24px 0',
};

const bodyText = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '16px',
  fontStyle: 'normal',
  lineHeight: '24px', 
  color: '#000000',     
  margin: '0 0 24px 0',
};


const previewStyle = {
  margin: '0 0 16px 0',
  fontSize: '13px',
  color: '#4b5563',
};

const reasonBox = {
  backgroundColor: '#f0f4ec',
  borderLeft: '4px solid #557541',
  padding: '16px',
  margin: '0 0 24px 0',
  borderRadius: '4px',
  fontSize: '15px',
  color: '#333333',
};

const ctaContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 24px 0',
};

const button = {
  backgroundColor: '#587244',
  color: '#ffffff',
  padding: '12px 24px',
  textDecoration: 'none',
  borderRadius: '12px',
  fontWeight: '600',
  display: 'inline-block',
  fontSize: '15px',
};

const footer = {
  backgroundColor: '#f8f9fa',
  padding: '24px 40px',
  fontSize: '13px',
  color: '#666666',
  borderTop: '1px solid #eeeeee',
};

const footerText = {
  margin: '0 0 12px 0',
  lineHeight: '1.4',
  color: '#666666',
};

const footerLink = {
  color: '#557541',
  textDecoration: 'underline',
};




const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  width: '600px',
  maxWidth: '600px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};

