import nodemailerConfig from '@/nodemailer.config';
import EmailService from '@/services/implementations/emailService';
import IEmailService from '@/services/interfaces/emailService';

// Initialize the email service with optional display name
const emailService: IEmailService = new EmailService(
  nodemailerConfig,
  'My App Name' // Optional: Display name that appears in the "From" field
);

// Example 1: Send a welcome email
async function sendWelcomeEmail(userEmail: string, userName: string) {
  const subject = 'Welcome to Our App!';
  const htmlBody = `
    <h1>Welcome, ${userName}!</h1>
    <p>Thank you for joining our application.</p>
    <p>We're excited to have you on board.</p>
    <br>
    <p>Best regards,<br>The Team</p>
  `;

  try {
    await emailService.sendEmail(userEmail, subject, htmlBody);
    console.log(`Welcome email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send welcome email: ${error}`);
  }
}

// Example 2: Send a password reset email
async function sendPasswordResetEmail(userEmail: string, resetLink: string) {
  const subject = 'Password Reset Request';
  const htmlBody = `
    <h2>Password Reset</h2>
    <p>We received a request to reset your password.</p>
    <p>Click the link below to reset your password:</p>
    <br>
    <a href="${resetLink}" style="
      background-color: #4CAF50;
      color: white;
      padding: 14px 20px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
    ">Reset Password</a>
    <br><br>
    <p><strong>This link will expire in 1 hour.</strong></p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  try {
    await emailService.sendEmail(userEmail, subject, htmlBody);
    console.log(`Password reset email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send password reset email: ${error}`);
  }
}

// Example 3: Send a notification email
async function sendNotificationEmail(
  userEmail: string,
  notificationTitle: string,
  notificationMessage: string
) {
  const subject = notificationTitle;
  const htmlBody = `
    <h2>${notificationTitle}</h2>
    <p>${notificationMessage}</p>
    <br>
    <p>Best regards,<br>The Team</p>
  `;

  try {
    await emailService.sendEmail(userEmail, subject, htmlBody);
    console.log(`Notification email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send notification email: ${error}`);
  }
}

// Example usage (uncomment to test):
// sendWelcomeEmail("user@example.com", "John Doe");
// sendPasswordResetEmail("user@example.com", "https://yourapp.com/reset?token=abc123");
// sendNotificationEmail("user@example.com", "New Update", "Check out our new features!");

export { sendWelcomeEmail, sendPasswordResetEmail, sendNotificationEmail };
