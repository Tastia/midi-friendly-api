import { QueueModule } from '@modules/services/queue/queue.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueJob, QueueJobSchema } from '@schemas/queueJob.schema';
import { QueueJobService } from './queue-job.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: QueueJob.name, schema: QueueJobSchema }])],
  providers: [QueueJobService],
  exports: [QueueJobService],
})
export class QueueJobModule {}
