import { AuthModule } from './../auth/auth.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { RestaurantModule } from '@modules/restaurant/restaurant.module';
import { UserModule } from '@modules/user/user.module';
import { LunchGroup, LunchGroupSchema } from '@schemas/lunchGroup.schema';
import { User, UserSchema } from '@schemas/user.schema';
import { forwardRef, Module } from '@nestjs/common';
import { LunchGroupService } from './lunch-group.service';
import { LunchGroupController } from './lunch-group.controller';
import { LunchGroupGateway } from './lunch-group.gateway';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: LunchGroup.name, schema: LunchGroupSchema },
    ]),
    UserModule,
    RestaurantModule,
    OrganizationModule,
    AuthModule,
  ],
  providers: [LunchGroupService, LunchGroupGateway],
  controllers: [LunchGroupController],
  exports: [MongooseModule, LunchGroupService],
})
export class LunchGroupModule {}
