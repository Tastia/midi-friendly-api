import { ApiProperty, OmitType } from '@nestjs/swagger';
import { CreateInvitationLinkDto } from './create-invitation-link.dto';

export class InviteUsersByEmail extends OmitType(CreateInvitationLinkDto, ['maxUsage']) {
  @ApiProperty()
  emails: string[];
}
