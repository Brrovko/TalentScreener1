import nodemailer from 'nodemailer';


function isValidEmail(email: string): boolean {
  // Simple RFC 5322 email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private transporter;
  private from: string;

  constructor() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASSWORD,
      SMTP_FROM,
    } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
      throw new Error('Missing SMTP environment variables');
    }
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      pool: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
    this.from = SMTP_FROM;
  }

  async sendMail(options: EmailOptions): Promise<void> {
    if (!isValidEmail(options.to)) {
      console.error(`[EmailService] Invalid recipient email: ${options.to}`);
      throw new Error('Invalid recipient email');
    }
    if (!options.subject || (!options.text && !options.html)) {
      console.error('[EmailService] Missing subject or body');
      throw new Error('Missing subject or body');
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      // console.info(`[EmailService] Email sent to ${options.to}: ${info.messageId}`);
    } catch (error) {
      // console.error(`[EmailService] Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

}
