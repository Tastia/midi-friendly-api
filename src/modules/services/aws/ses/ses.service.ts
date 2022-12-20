import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectAws } from 'aws-sdk-v3-nest';

@Injectable()
export class SesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectAws(SESClient) private readonly ses: SESClient,
  ) {}

  async sendEmail(params: { to: string; subject: string; html: string; text: string }) {
    try {
      Logger.debug(`Source email: ${this.configService.get<string>('aws.sesSourceEmail')}`);

      const command = new SendEmailCommand({
        Source: this.configService.get<string>('aws.sesSourceEmail') || 'pro.tastia@gmail.com',
        Destination: { ToAddresses: [params.to] },
        Message: {
          Subject: { Data: params.subject },
          Body: {
            Html: { Data: params.html },
            Text: { Data: params.text },
          },
        },
      });

      const sesResponse = await this.ses.send(command);
      Logger.debug(
        `sendMail requestId: ${sesResponse.$metadata.requestId} and messageId: ${sesResponse.MessageId}`,
        SesService.name,
      );
      return { success: true };
    } catch (err) {
      Logger.error(err.message, SesService.name);
      throw err;
    }
  }
}
