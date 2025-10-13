import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<SentMessageInfo> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info: SentMessageInfo = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`❌ Failed to send email: ${error.message}`);
      } else {
        this.logger.error('❌ Failed to send email: Unknown error');
      }
      throw error;
    }
  }

  async sendVerificationEmail(
    to: string,
    otp: string,
  ): Promise<SentMessageInfo> {
    const html = `
      <h2>Email Verification</h2>
      <p>Your OTP code is:</p>
      <h3>${otp}</h3>
      <p>This code will expire in 10 minutes.</p>
    `;
    return this.sendMail(to, 'Verify your email', html);
  }
}
