import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SES } from 'aws-sdk';
import { InjectAwsService } from 'nest-aws-sdk';

@Injectable()
export class SesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectAwsService(SES) private readonly ses: SES,
  ) {}

  async sendEmail(params: { to: string; subject: string; html: string; text: string }) {
    try {
      const sesResponse = await this.ses
        .sendEmail({
          Source: this.configService.get<string>('aws.sesSourceEmail'),
          Destination: { ToAddresses: [params.to] },
          Message: {
            Subject: { Data: params.subject },
            Body: {
              Html: { Data: params.html },
              Text: { Data: params.text },
            },
          },
        })
        .promise();
      Logger.debug(
        `sendMail requestId: ${sesResponse.$response.requestId} and messageId: ${sesResponse.MessageId}`,
        SesService.name,
      );
      return true;
    } catch (err) {
      Logger.error(err.message, SesService.name);
    }
  }
}
