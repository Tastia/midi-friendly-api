import { CurrentApp, RequesterApp } from './../../common/decorators/app.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { SetAdminAccessDto } from './dto/set-admin-access.dto';
import { UserService } from './user.service';
import { JWTAuth } from '@common/decorators/jwt-auth.decorator';
import { PaginatedQuery } from '@chronicstone/mongoose-search';
import { User } from '@schemas/user.schema';
import { CountQuery } from '@shared/dto/count-query.dto';
import { ActiveUser } from '@common/decorators/user.decorator';
import { AcceptInvitationDto } from '@modules/auth/dto/accept-invitation.dto';
import { CreateInvitationLinkDto } from '@modules/auth/dto/create-invitation-link.dto';
import { InviteUsersByEmailDto } from '@modules/auth/dto/invite-users-by-email.dto';
import { ValidateInvitationDto } from '@modules/auth/dto/validate-invitation.dto';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @JWTAuth()
  @Get()
  getUsers() {
    return this.userService.find({}, ['organizations']);
  }

  @Post('/list')
  @JWTAuth()
  @ApiOperation({ summary: 'Find all accounts (paginated)' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async list(
    @Query() { count }: CountQuery,
    @Body(new ValidationPipe({ transform: true })) query: PaginatedQuery,
    @ActiveUser() user: User,
  ) {
    return this.userService.list(query, count);
  }

  @JWTAuth()
  @Post('set-admin-access')
  setAdminAccess(@Body(ValidationPipe) createUserDto: SetAdminAccessDto) {
    return this.userService.updateOne(
      { _id: createUserDto.userId },
      { admin: createUserDto.allowAccess },
    );
  }

  @Delete(':id')
  deleteUser(@Body('id') userId: string) {
    return this.userService.deleteOne({ _id: userId });
  }

  @JWTAuth()
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
    return this.userService.createInvitationLink(invitationPayload);
  }

  @JWTAuth()
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
    return this.userService.inviteUsersByEmail(invitationPayload);
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
    return this.userService.getInvitationData(invitationPayload);
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
    return this.userService.acceptInvitation(invitationPayload);
  }

  @JWTAuth()
  @Post('complete-onboarding')
  @ApiOperation({ summary: 'Complete onboarding' })
  @ApiOkResponse({
    description: 'Success',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  completeOnboarding(@ActiveUser() user: User, @CurrentApp() app: RequesterApp) {
    return this.userService.completeOnboarding(user, app);
  }
}
