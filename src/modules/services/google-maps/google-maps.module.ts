import { S3Module } from './../aws/s3/s3.module';
import { Module } from '@nestjs/common';
import { GoogleMapsService } from './google-maps.service';
import { GoogleMapsController } from './google-maps.controller';

@Module({
  imports: [S3Module],
  providers: [GoogleMapsService],
  exports: [GoogleMapsService],
  controllers: [GoogleMapsController],
})
export class GoogleMapsModule {}
