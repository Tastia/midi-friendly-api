import { AuthModule } from '@modules/auth/auth.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { InvitationSchema } from '@schemas/invitation.schema';
import { Invitation } from './../../schemas/invitation.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { Organization, OrganizationSchema } from '@schemas/oraganization.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invitation.name, schema: InvitationSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    OrganizationModule,
    AuthModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
