import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InviteUsersByEmailDto } from './dto/invite-users-by-email.dto';
import {
  Body,
  Controller,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
  Param,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AccessTokenResponse } from './auth.type';
import { CreateInvitationLinkDto } from './dto/create-invitation-link.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { RequestWithUser } from './dto/request-with-account.interface';
import { ValidateInvitationDto } from './dto/validate-invitation.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({
    description: 'Success',
    type: AccessTokenResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(AuthGuard('local'))
  async login(
    @Req() { user }: RequestWithUser,
    @Body() {}: EmailLoginDto,
  ): Promise<AccessTokenResponse> {
    return this.authService.login(user);
  }

  @Post('invitation/create-invitation-link')
  @ApiOperation({ summary: 'Create shareable invitation link' })
  @ApiOkResponse({
    description: 'Success',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  // @UseGuards(AuthGuard('jwt'))
  createInvitationLink(
    @Body(new ValidationPipe({ transform: true })) invitationPayload: CreateInvitationLinkDto,
  ) {
    return this.authService.createInvitationLink(invitationPayload);
  }

  @Post('invitation/send-email-invitation')
  @ApiOperation({ summary: 'Send email invitation to specific people' })
  @ApiOkResponse({
    description: 'Success',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  // @UseGuards(AuthGuard('jwt'))
  sendEmailInvitation(
    @Body(new ValidationPipe({ transform: true })) invitationPayload: InviteUsersByEmailDto,
  ) {
    return this.authService.inviteUsersByEmail(invitationPayload);
  }

  @Post('invitation/validate-invitation')
  @ApiOperation({ summary: 'Validate invitation & get invitation data' })
  @ApiOkResponse({
    description: 'Success',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  validateInvitation(
    @Body(new ValidationPipe({ transform: true })) invitationPayload: ValidateInvitationDto,
  ) {
    return this.authService.getInvitationData(invitationPayload);
  }

  @Post('invitation/accept-invitation')
  @ApiOperation({ summary: 'Accept invitation' })
  @ApiOkResponse({
    description: 'Success',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  acceptInvitation(
    @Body(new ValidationPipe({ transform: true })) invitationPayload: AcceptInvitationDto,
  ) {
    return this.authService.acceptInvitation(invitationPayload);
  }
}
