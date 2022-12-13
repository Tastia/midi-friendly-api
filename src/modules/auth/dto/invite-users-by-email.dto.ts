import { ApiProperty, OmitType } from '@nestjs/swagger';
import { CreateInvitationLinkDto } from './create-invitation-link.dto';

export class InviteUsersByEmailDto extends OmitType(CreateInvitationLinkDto, ['maxUsage']) {
  @ApiProperty()
  emails: string[];
}
