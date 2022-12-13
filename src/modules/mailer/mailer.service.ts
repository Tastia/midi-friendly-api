import { QueueEmailsOperation } from './../../common/types/queue.type';
import { SesService } from './../services/aws/ses/ses.service';
import { MailerTemplateService } from './mailer-template.service';
import { Injectable } from '@nestjs/common';
import { QueueMailPayload } from '@common/types/queue.type';

@Injectable()
export class MailerService {
  constructor(
    private readonly mailerTemplateService: MailerTemplateService,
    private readonly sesService: SesService,
  ) {}

  async sendInvitationEmail(
    payload: QueueMailPayload<QueueEmailsOperation.InviteUser>['params'][number],
  ) {
    const { html, text, subject } = await this.mailerTemplateService.compileTemplate(
      QueueEmailsOperation.InviteUser,
      payload,
    );

    return this.sesService.sendEmail({
      to: payload.email,
      subject,
      html,
      text,
    });
  }
}
