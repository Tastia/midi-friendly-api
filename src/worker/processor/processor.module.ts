import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { ProctoringConsumer } from './proctoring.consumer';
// import { ScoringConsumer } from './scoring.consumer';
import { BullModule } from '@nestjs/bull';
import { Queues } from '@common/types/queue.type';
// import { ProctoringModule } from '@modules/core/proctoring/proctoring.module';
// import { ScoringModule } from '@modules/core/scoring/scoring.module';
// import { QueueController } from '@modules/core/queue/queue.controller';
// import { QueueService } from '@modules/core/queue/queue.service';
// import { PdfConsumer } from './pdf.consumer';
// import { MailConsumer } from './mail.consumer';
// import { PdfModule } from '@modules/core/pdf/pdf.module';
// import { MailerModule } from '@modules/mailer/mailer.module';
// import { AssessmentAssetConsumer } from './assessment-asset.consumer';
// import { CoreModule } from '@modules/core/core.module';
// import { EventLoggerModule } from '@modules/core/event-logger/event-loggerr.module';

@Module({
  imports: [
    MongooseModule.forFeature([], 'mongo'),
    BullModule.registerQueue({ name: Queues.MapsQueue }, { name: Queues.MailQueue }),
    // ProctoringModule,
    // ScoringModule,
    // PdfModule,
    // MailerModule,
    // CoreModule,
    // EventLoggerModule,
  ],
  providers: [
    // AssessmentAssetConsumer,
    // ProctoringConsumer,
    // ScoringConsumer,
    // PdfConsumer,
    // MailConsumer,
  ],
  exports: [
    // AssessmentAssetConsumer,
    // ProctoringConsumer,
    // ScoringConsumer,
    // PdfConsumer,
    // MailConsumer,
  ],
})
export class ProcessorModule {}
