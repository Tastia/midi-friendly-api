import { LunchGroupPollService } from './lunch-group-poll.service';
import { MongooseSearchModule } from '@chronicstone/mongoose-search';
import { AuthModule } from './../auth/auth.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { RestaurantModule } from '@modules/restaurant/restaurant.module';
import { UserModule } from '@modules/user/user.module';
import { LunchGroup, LunchGroupSchema } from '@schemas/lunchGroup.schema';
import { User, UserSchema } from '@schemas/user.schema';
import { Global, Module } from '@nestjs/common';
import { LunchGroupService } from './lunch-group.service';
import { LunchGroupController } from './lunch-group.controller';
import { LunchGroupGateway } from './lunch-group.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { LunchGroupPoll, LunchGroupPollSchema } from '@schemas/lunchGroupPoll.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: LunchGroup.name, schema: LunchGroupSchema },
      { name: LunchGroupPoll.name, schema: LunchGroupPollSchema },
    ]),
    UserModule,
    RestaurantModule,
    OrganizationModule,
    AuthModule,
    MongooseSearchModule.register(),
  ],
  providers: [LunchGroupService, LunchGroupPollService, LunchGroupGateway],
  controllers: [LunchGroupController],
  exports: [MongooseModule, LunchGroupService, LunchGroupPollService, LunchGroupGateway],
})
export class LunchGroupModule {}
