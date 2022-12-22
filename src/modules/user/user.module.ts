import { OrganizationModule } from '@modules/organization/organization.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseSearchModule, MongooseSearchService } from '@chronicstone/mongoose-search';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    OrganizationModule,
    MongooseSearchModule.register(),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
