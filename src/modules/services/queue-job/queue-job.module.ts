import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueJob, QueueJobSchema } from '@schemas/queueJob.schema';
import { QueueJobService } from './queue-job.service';
import { QueueJobController } from './queue-job.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: QueueJob.name, schema: QueueJobSchema }])],
  providers: [QueueJobService],
  exports: [QueueJobService],
  controllers: [QueueJobController],
})
export class QueueJobModule {}
