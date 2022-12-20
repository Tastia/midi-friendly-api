import { Module } from '@nestjs/common';
import { SesService } from './ses.service';
import { AwsSdkModule } from 'aws-sdk-v3-nest';
import { SESClient } from '@aws-sdk/client-ses';
@Module({
  imports: [
    AwsSdkModule.register({
      client: new SESClient({
        region: process.env.AWS_SES_REGION,
      }),
    }),
  ],
  providers: [SesService],
  exports: [SesService],
})
export class SesModule {}
