import { Module } from '@nestjs/common';
import { MailerTemplateService } from './mailer-template.service';

@Module({
  providers: [MailerTemplateService],
  controllers: [],
})
export class MailerModule {}
