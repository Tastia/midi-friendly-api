import { Organization, OrganizationSchema } from '@schemas/oraganization.schema';
import { ServicesModule } from '@modules/services/services.module';
import { RestaurantModule } from '@modules/restaurant/restaurant.module';
import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Organization.name, schema: OrganizationSchema }]),
    RestaurantModule,
    ServicesModule,
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
