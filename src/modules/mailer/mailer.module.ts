import { ServicesModule } from '@modules/services/services.module';
import { Module } from '@nestjs/common';
import { MailerTemplateService } from './mailer-template.service';
import { MailerService } from './mailer.service';

@Module({
  imports: [ServicesModule],
  providers: [MailerTemplateService, MailerService],
  controllers: [],
  exports: [MailerService],
})
export class MailerModule {}
