import * as Brevo from '@getbrevo/brevo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class SmtpService {
  private readonly apiInstance: Brevo.TransactionalEmailsApi;
  private readonly senderEmail: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
  ) {
    this.apiInstance = new Brevo.TransactionalEmailsApi();

    this.apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      this.config.getOrThrow('smtp.apiKey'),
    );

    this.senderEmail = this.config.getOrThrow('smtp.senderEmail');
  }

  async sendMail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    this.logger.debug(
      `Starting email dispatch to [${to}] with subject: "${subject}"`,
      'SmtpService',
    );

    try {
      await this.apiInstance.sendTransacEmail({
        sender: {
          email: this.senderEmail,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      });

      this.logger.log(`Email dispatched successfully to [${to}]`, 'SmtpService');
    } catch (error) {
      this.logger.error(
        `Email dispatch failed to [${to}]. Reason: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SmtpService',
      );

      throw error;
    }
  }
}
