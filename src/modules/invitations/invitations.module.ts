import { InvitationSchema } from '@schemas/invitation.schema';
import { Invitation } from './../../schemas/invitation.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Invitation.name, schema: InvitationSchema }])],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
