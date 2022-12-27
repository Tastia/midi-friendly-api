import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { Restaurant, RestaurantSchema } from '@schemas/restaurant.schema';
import { OrganizationSchema, Organization } from '@schemas/oraganization.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { FiltersService } from './filters.service';
import { FiltersController } from './filters.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    OrganizationModule,
    UserModule,
    AuthModule,
  ],
  providers: [FiltersService],
  controllers: [FiltersController],
})
export class FiltersModule {}
