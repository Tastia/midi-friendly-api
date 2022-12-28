import { UserDocument } from '@schemas/user.schema';
import { ActiveUser } from './../../common/decorators/user.decorator';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AccessTokenResponse } from './auth.type';
import { EmailLoginDto } from './dto/email-login.dto';
import { RequestWithUser } from './dto/request-with-account.interface';

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
    return this.authService.login(user, false);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({
    description: 'Success',
    type: AccessTokenResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(AuthGuard('local'))
  async loginAdmin(
    @ActiveUser() user: UserDocument,
    @Body() {}: EmailLoginDto,
  ): Promise<AccessTokenResponse> {
    return this.authService.login(user, true);
  }
}
