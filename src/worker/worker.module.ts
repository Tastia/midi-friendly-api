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
import { ProcessorModule } from './processor/processor.module';
import { WorkerService } from './worker.service';
import { ScheduleModule } from '@nestjs/schedule';
import { RestaurantModule } from '@modules/restaurant/restaurant.module';
import { OrganizationModule } from '@modules/organization/organization.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, awsConfig, bullConfig, workerConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('app.database.url'),
        useNewUrlParser: true,
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useClass: BullConfigService,
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([], 'mongo'),
    ProcessorModule,
    QueueModule,
  ],
  providers: [WorkerService],
})
export class WorkerModule {}
