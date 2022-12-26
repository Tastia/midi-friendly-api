import { AuthModule } from '@modules/auth/auth.module';
import { Queues } from '@common/types/queue.type';
import { BullModule } from '@nestjs/bull';
import { Organization, OrganizationSchema } from '@schemas/oraganization.schema';
import { ServicesModule } from '@modules/services/services.module';
import { RestaurantModule } from '@modules/restaurant/restaurant.module';
import { Module, forwardRef } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Organization.name, schema: OrganizationSchema }]),
    BullModule.registerQueue({ name: Queues.MapsQueue }),
    RestaurantModule,
    ServicesModule,
    forwardRef(() => AuthModule),
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
