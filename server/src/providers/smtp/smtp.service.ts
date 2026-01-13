import * as Brevo from '@getbrevo/brevo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class SmtpService {
  private readonly CONTEXT = SmtpService.name;
  private readonly apiInstance: Brevo.TransactionalEmailsApi;
  private readonly senderEmail: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
  ) {
    this.logger.debug(
      `Initializing SMTP service configuration - API Key: ${this.config.get('smtp.apiKey') ? 'Present' : 'Missing'}, Sender Email: ${this.config.get('smtp.senderEmail') ? 'Present' : 'Missing'}`,
      this.CONTEXT,
    );

    try {
      this.apiInstance = new Brevo.TransactionalEmailsApi();

      const apiKey = this.config.getOrThrow<string>('smtp.apiKey');
      this.apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

      this.senderEmail = this.config.getOrThrow('smtp.senderEmail');

      this.logger.log(
        `SMTP service initialized successfully - Provider: Brevo, Sender: ${this.senderEmail}`,
        this.CONTEXT,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize SMTP service: ${error instanceof Error ? error.message : 'Unknown configuration error'}`,
        error instanceof Error ? error.stack : undefined,
        this.CONTEXT,
      );
      throw error;
    }
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
      `Initiating email dispatch to [${to}] with subject "${subject}" (HTML length: ${html.length} chars)`,
      this.CONTEXT,
    );

    try {
      const emailPayload = {
        sender: { email: this.senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      };

      await this.apiInstance.sendTransacEmail(emailPayload);

      this.logger.log(
        `Email successfully queued for delivery to [${to}] with subject "${subject}"`,
        this.CONTEXT,
      );
    } catch (error) {
      const errorMessage = `Email dispatch failed to [${to}] with subject "${subject}": ${
        error instanceof Error ? error.message : 'Unknown error occurred'
      }`;

      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(errorMessage, errorStack, this.CONTEXT);

      throw error;
    }
  }
}
