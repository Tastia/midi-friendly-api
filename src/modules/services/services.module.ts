import { Module } from '@nestjs/common';
import { GoogleMapsModule } from './google-maps/google-maps.module';
import { AwsS3Module } from './aws-s3/aws-s3.module';

@Module({
  imports: [GoogleMapsModule, AwsS3Module],
  exports: [GoogleMapsModule, AwsS3Module],
})
export class ServicesModule {}
