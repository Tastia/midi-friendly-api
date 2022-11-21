import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueJob, QueueJobSchema } from '@schemas/queueJob.schema';
import { QueueJobService } from './queue-job.service';
import { QueueJobGateway } from './queue-job.gateway';

@Module({
  imports: [MongooseModule.forFeature([{ name: QueueJob.name, schema: QueueJobSchema }])],
  providers: [QueueJobService, QueueJobGateway],
  exports: [QueueJobService],
})
export class QueueJobModule {}
