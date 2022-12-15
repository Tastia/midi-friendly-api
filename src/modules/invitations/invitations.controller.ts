import { InvitationsService } from './invitations.service';
import { Controller, Get } from '@nestjs/common';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationService: InvitationsService) {}

  @Get('')
  findAll() {
    return this.invitationService.find({}, [
      { path: 'organization' },
      { path: 'usage.linkedAccount' },
    ]);
  }
}
