import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { AwsSdkModule } from 'aws-sdk-v3-nest';
import { S3Client } from '@aws-sdk/client-s3';

@Module({
  imports: [
    AwsSdkModule.register({
      client: new S3Client({
        region: process.env.AWS_S3_REGION,
      }),
    }),
  ],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
