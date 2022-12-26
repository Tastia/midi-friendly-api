import { AuthModule } from '@modules/auth/auth.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { MongooseSearchModule } from '@chronicstone/mongoose-search';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, forwardRef } from '@nestjs/common';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { Restaurant, RestaurantSchema } from '@schemas/restaurant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Restaurant.name, schema: RestaurantSchema }]),
    MongooseSearchModule.register(),
    forwardRef(() => OrganizationModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
