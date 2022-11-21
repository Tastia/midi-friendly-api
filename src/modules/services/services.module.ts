import { Module } from '@nestjs/common';
import { GoogleMapsModule } from './google-maps/google-maps.module';
import { AwsModule } from './aws/aws.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [GoogleMapsModule, AwsModule, QueueModule],
  exports: [GoogleMapsModule, AwsModule, QueueModule],
})
export class ServicesModule {}
