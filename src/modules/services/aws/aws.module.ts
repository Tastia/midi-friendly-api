import { Module } from '@nestjs/common';
import { S3Module } from './s3/s3.module';
import { SesModule } from './ses/ses.module';

@Module({
  imports: [S3Module, SesModule],
  exports: [S3Module, SesModule],
})
export class AwsModule {}
