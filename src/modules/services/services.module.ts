import { Module } from '@nestjs/common';
import { GoogleMapsModule } from './google-maps/google-maps.module';
import { AwsModule } from './aws/aws.module';
import { QueueModule } from './queue/queue.module';
import { QueueJobModule } from './queue-job/queue-job.module';

@Module({
  imports: [GoogleMapsModule, AwsModule, QueueModule, QueueJobModule],
  exports: [GoogleMapsModule, AwsModule, QueueModule, QueueJobModule],
})
export class ServicesModule {}
