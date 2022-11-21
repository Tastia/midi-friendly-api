import { QueueJobModule } from './../queue-job/queue-job.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { Queues } from '@common/types/queue.type';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    MongooseModule.forFeature([], 'mongo'),
    BullModule.registerQueue({ name: Queues.MapsQueue }, { name: Queues.MailQueue }),
    QueueJobModule,
  ],
  providers: [QueueService],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule {}
