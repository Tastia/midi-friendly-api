import { MailerModule } from '@modules/mailer/mailer.module';
import { QueueModule } from '@modules/services/queue/queue.module';
import { RestaurantModule } from '@modules/restaurant/restaurant.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { Restaurant, RestaurantSchema } from '@schemas/restaurant.schema';
import { ServicesModule } from '@modules/services/services.module';
import { MapsConsumer } from './consumers/maps.consumer';
import { MailerConsumer } from './consumers/mailer.consumer';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { Queues } from '@common/types/queue.type';
import { User, UserSchema } from '@schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    BullModule.registerQueue({ name: Queues.MapsQueue }, { name: Queues.MailQueue }),
    ServicesModule,
    OrganizationModule,
    RestaurantModule,
    QueueModule,
    MailerModule,
  ],
  providers: [MailerConsumer, MapsConsumer],
  exports: [MailerConsumer, MapsConsumer],
})
export class ProcessorModule {}
