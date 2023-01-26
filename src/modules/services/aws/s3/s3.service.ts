import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectAws } from 'aws-sdk-v3-nest';

@Injectable()
export class S3Service {
  constructor(
    private readonly configService: ConfigService,
    @InjectAws(S3Client) private readonly ses: S3Client,
  ) {}

  async uploadImageFromBuffer(fileBody: Buffer, fileName: string) {
    const params = {
      Bucket: this.configService.get<string>('aws.s3Bucket'),
      Region: this.configService.get<string>('aws.s3Region'),
      Key: fileName,
      Body: fileBody,
      ContentType: 'image/jpeg',
    };

    return this.ses.send(new PutObjectCommand(params));
  }
}
