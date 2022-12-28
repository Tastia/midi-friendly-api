import { Invitation, InvitationSchema } from '@schemas/invitation.schema';
import { AuthModule } from '@modules/auth/auth.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseSearchModule } from '@chronicstone/mongoose-search';
import { Organization, OrganizationSchema } from '@schemas/oraganization.schema';
import { QueueModule } from '@modules/services/queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Invitation.name, schema: InvitationSchema },
    ]),
    MongooseSearchModule.register(),
    QueueModule,
    forwardRef(() => AuthModule),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
