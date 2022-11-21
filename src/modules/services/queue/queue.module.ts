import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Assessment, AssessmentSchema } from '@schemas/assesment.schema';
import { BullModule } from '@nestjs/bull';
import { Queues } from '@common/types/queue.type';
import { QueueController } from '@modules/core/queue/queue.controller';
import { QueueService } from '@modules/core/queue/queue.service';
import { EntityModule } from '@modules/entity/entity.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Assessment.name, schema: AssessmentSchema }], 'mongo'),
    BullModule.registerQueue(
      { name: Queues.ScoringQueue },
      { name: Queues.ProctoringQueue },
      { name: Queues.PdfQueue },
      { name: Queues.MailQueue },
      { name: Queues.AssetQueue },
    ),
    EntityModule,
  ],
  providers: [QueueService],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule {}
