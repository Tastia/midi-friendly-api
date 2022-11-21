import { Module } from '@nestjs/common';
import { QueueModule } from '@modules/services/queue/queue.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '@config/app.config';
import awsConfig from '@config/aws.config';
import bullConfig from '@config/bull.config';
import workerConfig from '@config/worker.config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { BullConfigService } from '@common/services/bull/bull.config.service';
import { AwsSdkModule } from 'nest-aws-sdk';
import { awsHandlerConfig } from '@modules/services/aws/aws.config';
import { ProcessorModule } from './processor/processor.module';
import { WorkerService } from './worker.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, awsConfig, bullConfig, workerConfig],
    }),
    MongooseModule.forRoot(appConfig().database.url, {
      connectionName: 'mongo',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useClass: BullConfigService,
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([], 'mongo'),
    AwsSdkModule.forRootAsync(awsHandlerConfig()),
    ProcessorModule,
    QueueModule,
  ],
  providers: [WorkerService],
})
export class WorkerModule {}