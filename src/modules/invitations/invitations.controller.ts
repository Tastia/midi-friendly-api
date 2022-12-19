import { InvitationsService } from './invitations.service';
import { Controller, Get } from '@nestjs/common';
import { JWTAuth } from '@common/decorators/jwt-auth.decorator';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationService: InvitationsService) {}

  @JWTAuth()
  @Get('')
  findAll() {
    return this.invitationService.find({}, [
      { path: 'organization' },
      { path: 'usage.linkedAccount' },
    ]);
  }
}
