import { AuthModule } from '@modules/auth/auth.module';
import { MongooseSearchModule } from '@chronicstone/mongoose-search';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, forwardRef } from '@nestjs/common';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { Restaurant, RestaurantSchema } from '@schemas/restaurant.schema';
import { Organization, OrganizationSchema } from '@schemas/oraganization.schema';
import { GoogleMapsModule } from '@modules/services/google-maps/google-maps.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    MongooseSearchModule.register(),
    forwardRef(() => AuthModule),
    forwardRef(() => GoogleMapsModule),
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
